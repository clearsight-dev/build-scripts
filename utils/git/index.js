import shell from "shelljs";

// Function to switch to a branch or tag and pull the latest changes
export function switchBranchOrTag(branchOrTag) {
  shell.exec("git fetch --tags --force origin");
  // Switch to the desired branch or tag
  shell.exec(`git checkout ${branchOrTag}`);

  // Pull the latest changes
  shell.exec("git pull");
}

export function resetGITChanges(branchOrTag) {
  shell.exec("git fetch origin");
  shell.exec("git checkout origin/main");
  shell.exec("git branch -D main");
  shell.exec("git reset --hard");
  shell.exec("git clean -fd");
  shell.exec("git branch -D " + branchOrTag);
  shell.exec("git tag -d " + branchOrTag);
}
