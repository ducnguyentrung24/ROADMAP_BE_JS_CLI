import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DATA_FILE = path.join(process.cwd(), "tasks.json");

const VALID_STATUSES = ["todo", "in-progress", "done"];

// In lỗi ra stderr và thiết lập exit code khác 0
function printError(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// Đọc danh sách task từ file JSON
async function loadTasks() {
  try {
    const text = await readFile(DATA_FILE, "utf8");

    // Nếu file rỗng thì xem như chưa có task
    if (!text.trim()) {
      return [];
    }

    const tasks = JSON.parse(text);

    // Đảm bảo dữ liệu trong file là một mảng
    if (!Array.isArray(tasks)) {
      throw new Error("tasks.json must contain an array");
    }

    return tasks;
  } catch (error) {
    // File chưa tồn tại thì tạo file mới với mảng rỗng
    if (error.code === "ENOENT") {
      await saveTasks([]);
      return [];
    }

    // Nếu JSON bị lỗi
    if (error instanceof SyntaxError) {
      throw new Error("tasks.json contains invalid JSON");
    }

    throw error;
  }
}

// Ghi danh sách task vào file JSON
async function saveTasks(tasks) {
  await writeFile(DATA_FILE, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
}

// Tạo ID mới dựa trên ID lớn nhất hiện tại
function getNextId(tasks) {
  if (tasks.length === 0) {
    return 1;
  }

  return Math.max(...tasks.map((task) => task.id)) + 1;
}

// Tìm task theo ID
function findTask(tasks, id) {
  return tasks.find((task) => task.id === id);
}

// Kiểm tra ID có hợp lệ không
function parseTaskId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Kiểm tra description
function validateDescription(description) {
  if (!description || !description.trim()) {
    printError("task description cannot be empty");
    return false;
  }

  return true;
}

// Thêm task mới
async function addTask(description) {
  if (!validateDescription(description)) {
    return;
  }

  const tasks = await loadTasks();
  const now = new Date().toISOString();

  const newTask = {
    id: getNextId(tasks),
    description: description.trim(),
    status: "todo",
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(newTask);

  await saveTasks(tasks);

  console.log(`Task added successfully (ID: ${newTask.id})`);
}

// Cập nhật description của task
async function updateTask(idValue, description) {
  const id = parseTaskId(idValue);

  if (id === null) {
    printError("please provide a valid task ID");
    return;
  }

  if (!validateDescription(description)) {
    return;
  }

  const tasks = await loadTasks();
  const task = findTask(tasks, id);

  if (!task) {
    printError(`task not found: ${id}`);
    return;
  }

  task.description = description.trim();
  task.updatedAt = new Date().toISOString();

  await saveTasks(tasks);

  console.log(`Task updated successfully (ID: ${id})`);
}

// Xóa task
async function deleteTask(idValue) {
  const id = parseTaskId(idValue);

  if (id === null) {
    printError("please provide a valid task ID");
    return;
  }

  const tasks = await loadTasks();
  const taskIndex = tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    printError(`task not found: ${id}`);
    return;
  }

  tasks.splice(taskIndex, 1);

  await saveTasks(tasks);

  console.log(`Task deleted successfully (ID: ${id})`);
}

// Cập nhật trạng thái task
async function markTask(idValue, status) {
  const id = parseTaskId(idValue);

  if (id === null) {
    printError("please provide a valid task ID");
    return;
  }

  const tasks = await loadTasks();
  const task = findTask(tasks, id);

  if (!task) {
    printError(`task not found: ${id}`);
    return;
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();

  await saveTasks(tasks);

  console.log(`Task marked as ${status} (ID: ${id})`);
}

// Hiển thị danh sách task
function printTasks(tasks) {
  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  for (const task of tasks) {
    console.log(
      `[${task.id}] ${task.description} (${task.status})`
    );
    console.log(`    Created: ${task.createdAt}`);
    console.log(`    Updated: ${task.updatedAt}`);
  }
}

// Lọc và hiển thị task theo trạng thái
async function listTasks(status) {
  const tasks = await loadTasks();

  if (!status) {
    printTasks(tasks);
    return;
  }

  if (!VALID_STATUSES.includes(status)) {
    printError(
      `invalid status: ${status}. Use todo, in-progress, or done`
    );
    return;
  }

  const filteredTasks = tasks.filter((task) => task.status === status);

  printTasks(filteredTasks);
}

// Hiển thị hướng dẫn sử dụng
function printHelp() {
  console.log(`
Task Tracker CLI

Usage:
  node task-cli.js add "Task description"
  node task-cli.js update <id> "New description"
  node task-cli.js delete <id>
  node task-cli.js mark-in-progress <id>
  node task-cli.js mark-done <id>
  node task-cli.js list
  node task-cli.js list todo
  node task-cli.js list in-progress
  node task-cli.js list done
`);
}

// Xử lý command từ terminal
async function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case "add": {
        const description = args.join(" ");
        await addTask(description);
        break;
      }

      case "update": {
        const [id, ...descriptionParts] = args;
        const description = descriptionParts.join(" ");

        await updateTask(id, description);
        break;
      }

      case "delete": {
        const [id] = args;
        await deleteTask(id);
        break;
      }

      case "mark-in-progress": {
        const [id] = args;
        await markTask(id, "in-progress");
        break;
      }

      case "mark-done": {
        const [id] = args;
        await markTask(id, "done");
        break;
      }

      case "list": {
        const [status] = args;
        await listTasks(status);
        break;
      }

      case "help":
      case undefined:
        printHelp();
        break;

      default:
        printError(`unknown command: ${command}`);
        printHelp();
    }
  } catch (error) {
    printError(error.message || "something went wrong");
  }
}

await main();