import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Tạo giao diện đọc dữ liệu từ terminal
const readline = createInterface({
  input,
  output,
});

// Số lượt đoán theo từng độ khó
const DIFFICULTIES = {
  easy: {
    name: "Easy",
    chances: 10,
  },
  medium: {
    name: "Medium",
    chances: 5,
  },
  hard: {
    name: "Hard",
    chances: 3,
  },
};

// In lỗi ra stderr và thiết lập exit code
function printError(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// Tạo số ngẫu nhiên từ 1 đến 100
function generateSecretNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

// Hiển thị lời chào và luật chơi
function printWelcome() {
  console.log("Welcome to the Number Guessing Game!");
  console.log("I'm thinking of a number between 1 and 100.");
  console.log("You need to guess the number within a limited number of chances.");
  console.log("");
}

// Hiển thị lựa chọn độ khó
function printDifficultyOptions() {
  console.log("Please select the difficulty level:");
  console.log("1. Easy (10 chances)");
  console.log("2. Medium (5 chances)");
  console.log("3. Hard (3 chances)");
}

// Chuyển lựa chọn 1, 2, 3 thành độ khó
function getDifficulty(choice) {
  const difficultyMap = {
    "1": DIFFICULTIES.easy,
    "2": DIFFICULTIES.medium,
    "3": DIFFICULTIES.hard,
  };

  return difficultyMap[choice] || null;
}

// Đọc lựa chọn độ khó hợp lệ
async function chooseDifficulty() {
  while (true) {
    printDifficultyOptions();

    const choice = await readline.question("Enter your choice: ");
    const difficulty = getDifficulty(choice.trim());

    if (difficulty) {
      return difficulty;
    }

    console.log("Invalid choice. Please select 1, 2, or 3.");
    console.log("");
  }
}

// Đọc một số nguyên hợp lệ từ người dùng
async function askForGuess() {
  while (true) {
    const answer = await readline.question("Enter your guess: ");
    const guess = Number(answer.trim());

    if (
      Number.isInteger(guess) &&
      guess >= 1 &&
      guess <= 100
    ) {
      return guess;
    }

    console.log("Please enter a whole number between 1 and 100.");
  }
}

// Chạy một vòng chơi
async function playRound() {
  const secretNumber = generateSecretNumber();
  const difficulty = await chooseDifficulty();

  let attempts = 0;

  console.log("");
  console.log(
    `Great! You have selected the ${difficulty.name} difficulty level.`
  );
  console.log("Let's start the game!");
  console.log("");

  while (attempts < difficulty.chances) {
    const guess = await askForGuess();
    attempts += 1;

    if (guess === secretNumber) {
      console.log("");
      console.log(
        `Congratulations! You guessed the correct number in ${attempts} attempts.`
      );
      return;
    }

    if (guess < secretNumber) {
      console.log(
        `Incorrect! The number is greater than ${guess}.`
      );
    } else {
      console.log(
        `Incorrect! The number is less than ${guess}.`
      );
    }

    const remainingChances = difficulty.chances - attempts;

    if (remainingChances > 0) {
      console.log(
        `You have ${remainingChances} chance${
          remainingChances === 1 ? "" : "s"
        } left.`
      );
    }

    console.log("");
  }

  console.log(
    `Game over! You ran out of chances. The correct number was ${secretNumber}.`
  );
}

// Hỏi người chơi có muốn chơi lại không
async function askToPlayAgain() {
  while (true) {
    const answer = await readline.question(
      "Do you want to play again? (y/n): "
    );

    const choice = answer.trim().toLowerCase();

    if (choice === "y" || choice === "yes") {
      return true;
    }

    if (choice === "n" || choice === "no") {
      return false;
    }

    console.log("Please enter y or n.");
  }
}

// Chương trình chính
async function main() {
    printWelcome();

    let shouldPlay = true;

    while (shouldPlay) {
        await playRound();
        console.log("");

        shouldPlay = await askToPlayAgain();
        console.log("");
    }

    console.log("Thanks for playing!");
}

try {
    await main();
} catch {
    printError("the game could not continue");
} finally {
    readline.close();
}