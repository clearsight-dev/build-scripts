import shell from "shelljs";

// Function to switch to a branch or tag and pull the latest changes
export function switchBranchOrTag(branchOrTag) {
  shell.exec("git fetch --tags --force origin");
  // Switch to the desired branch or tag
  shell.exec(`git checkout ${branchOrTag}`);

  // Pull the latest changes
  shell.exec("git pull");
}

export function resetGITChanges() {
  shell.exec("git reset --hard HEAD");
  shell.exec("git clean -fd");
}
