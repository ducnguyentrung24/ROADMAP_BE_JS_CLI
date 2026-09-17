const username = process.argv[2];

// Hàm in lỗi ra stderr và thiết lập exit code khác 0
function printError(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

// Hàm in thông tin GitHub profile
function printProfile(profile) {
  console.log(`Name: ${profile.name || "not set"}`);
  console.log(`Username: ${profile.login}`);
  console.log(`Profile: ${profile.html_url}`);
  console.log(`Public repos: ${profile.public_repos}`);
  console.log(`Followers: ${profile.followers}`);
}

// Hàm gọi GitHub API
async function fetchGitHubProfile(username) {
  // encodeURIComponent giúp username an toàn khi đưa vào URL
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "github-profile-cli",
      },
    });
  } catch {
    printError("could not reach GitHub");
    return null;
  }

  // Chuyển response JSON thành object JavaScript
  const data = await response.json().catch(() => null);

  // GitHub trả về 404 nếu username không tồn tại
  if (response.status === 404) {
    printError(`GitHub user not found: ${username}`);
    return null;
  }

  // Xử lý các lỗi HTTP khác
  if (!response.ok) {
    printError(
      data?.message ||
        `GitHub request failed with status ${response.status}`
    );

    return null;
  }

  return data;
}

async function main() {
  // Kiểm tra người dùng đã nhập username chưa
  if (!username) {
    printError("please provide a GitHub username");
    return;
  }

  const profile = await fetchGitHubProfile(username);

  // Nếu gọi API thất bại thì dừng chương trình
  if (!profile) {
    return;
  }

  printProfile(profile);
}

await main();