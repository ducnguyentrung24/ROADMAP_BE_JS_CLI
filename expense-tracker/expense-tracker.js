import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DATA_FILE = path.join(process.cwd(), "expenses.json");

// In lỗi ra stderr và thiết lập exit code khác 0
function printError(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// Đọc danh sách expenses từ file JSON
async function loadExpenses() {
  try {
    const text = await readFile(DATA_FILE, "utf8");

    if (!text.trim()) {
      return [];
    }

    const expenses = JSON.parse(text);

    if (!Array.isArray(expenses)) {
      throw new Error("expenses.json must contain an array");
    }

    return expenses;
  } catch (error) {
    // Nếu file chưa tồn tại thì tạo file mới
    if (error.code === "ENOENT") {
      await saveExpenses([]);
      return [];
    }

    // Nếu JSON bị lỗi
    if (error instanceof SyntaxError) {
      throw new Error("expenses.json contains invalid JSON");
    }

    throw error;
  }
}

// Lưu expenses vào file JSON
async function saveExpenses(expenses) {
  await writeFile(
    DATA_FILE,
    `${JSON.stringify(expenses, null, 2)}\n`,
    "utf8"
  );
}

// Lấy ID tiếp theo
function getNextId(expenses) {
  if (expenses.length === 0) {
    return 1;
  }

  return Math.max(...expenses.map((expense) => expense.id)) + 1;
}

// Chuyển chuỗi amount thành số hợp lệ
function parseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

// Chuyển chuỗi ID thành số nguyên
function parseId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Lấy giá trị của option, ví dụ --description "Lunch"
function getOption(args, optionName) {
  const optionIndex = args.indexOf(optionName);

  if (optionIndex === -1) {
    return null;
  }

  return args[optionIndex + 1] || null;
}

// Kiểm tra option có tồn tại hay không
function hasOption(args, optionName) {
  return args.includes(optionName);
}

// Định dạng tiền
function formatAmount(amount) {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

// Định dạng ngày theo YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Lấy tên tháng
function getMonthName(month) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(new Date(2000, month - 1, 1));
}

// Kiểm tra description
function validateDescription(description) {
  if (!description || !description.trim()) {
    printError("description is required");
    return false;
  }

  return true;
}

// Thêm expense
async function addExpense(args) {
  const description = getOption(args, "--description");
  const amountValue = getOption(args, "--amount");

  if (!validateDescription(description)) {
    return;
  }

  const amount = parseAmount(amountValue);

  if (amount === null) {
    printError("amount must be a number greater than 0");
    return;
  }

  const expenses = await loadExpenses();

  const expense = {
    id: getNextId(expenses),
    date: formatDate(new Date()),
    description: description.trim(),
    amount,
  };

  expenses.push(expense);

  await saveExpenses(expenses);

  console.log(
    `Expense added successfully (ID: ${expense.id})`
  );
}

// Cập nhật expense
async function updateExpense(args) {
  const idValue = getOption(args, "--id");
  const description = getOption(args, "--description");
  const amountValue = getOption(args, "--amount");

  const id = parseId(idValue);

  if (id === null) {
    printError("please provide a valid expense ID");
    return;
  }

  if (!description && !amountValue) {
    printError(
      "please provide --description, --amount, or both"
    );
    return;
  }

  if (description !== null && !validateDescription(description)) {
    return;
  }

  let amount = null;

  if (amountValue !== null) {
    amount = parseAmount(amountValue);

    if (amount === null) {
      printError("amount must be a number greater than 0");
      return;
    }
  }

  const expenses = await loadExpenses();
  const expense = expenses.find((item) => item.id === id);

  if (!expense) {
    printError(`expense not found: ${id}`);
    return;
  }

  if (description !== null) {
    expense.description = description.trim();
  }

  if (amount !== null) {
    expense.amount = amount;
  }

  await saveExpenses(expenses);

  console.log(
    `Expense updated successfully (ID: ${expense.id})`
  );
}

// Xóa expense
async function deleteExpense(args) {
  const idValue = getOption(args, "--id");
  const id = parseId(idValue);

  if (id === null) {
    printError("please provide a valid expense ID");
    return;
  }

  const expenses = await loadExpenses();
  const expenseIndex = expenses.findIndex(
    (expense) => expense.id === id
  );

  if (expenseIndex === -1) {
    printError(`expense not found: ${id}`);
    return;
  }

  expenses.splice(expenseIndex, 1);

  await saveExpenses(expenses);

  console.log("Expense deleted successfully");
}

// Hiển thị danh sách expense
async function listExpenses() {
  const expenses = await loadExpenses();

  if (expenses.length === 0) {
    console.log("No expenses found.");
    return;
  }

  console.log("ID  Date        Description             Amount");

  for (const expense of expenses) {
    const id = String(expense.id).padEnd(4);
    const date = expense.date.padEnd(12);
    const description = expense.description
      .slice(0, 22)
      .padEnd(24);
    const amount = formatAmount(expense.amount);

    console.log(`${id}${date}${description}${amount}`);
  }
}

// Tính tổng amount
function calculateTotal(expenses) {
  return expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
}

// Hiển thị summary
async function showSummary(args) {
  const monthValue = getOption(args, "--month");
  const expenses = await loadExpenses();

  // Summary tất cả expenses
  if (monthValue === null) {
    const total = calculateTotal(expenses);

    console.log(`Total expenses: ${formatAmount(total)}`);
    return;
  }

  const month = Number(monthValue);
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    printError("month must be a number between 1 and 12");
    return;
  }

  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);

    return (
      expenseDate.getFullYear() === currentYear &&
      expenseDate.getMonth() + 1 === month
    );
  });

  const total = calculateTotal(monthlyExpenses);
  const monthName = getMonthName(month);

  console.log(
    `Total expenses for ${monthName}: ${formatAmount(total)}`
  );
}

// Hiển thị hướng dẫn
function printHelp() {
  console.log(`
Expense Tracker CLI

Commands:

  Add expense:
    node expense-tracker.js add --description "Lunch" --amount 20

  Update expense:
    node expense-tracker.js update --id 1 --description "Dinner" --amount 30

  Delete expense:
    node expense-tracker.js delete --id 1

  List all expenses:
    node expense-tracker.js list

  Show total expenses:
    node expense-tracker.js summary

  Show expenses for a month:
    node expense-tracker.js summary --month 8
`);
}

// Xử lý command
async function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case "add":
        await addExpense(args);
        break;

      case "update":
        await updateExpense(args);
        break;

      case "delete":
        await deleteExpense(args);
        break;

      case "list":
        await listExpenses();
        break;

      case "summary":
        await showSummary(args);
        break;

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