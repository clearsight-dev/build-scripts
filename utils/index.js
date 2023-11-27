import fs from "fs";
import path from "path";
import moment from "moment";
import { randomInt } from "crypto";

function convertIsoToAmPm(isoString) {
  const date = moment(isoString);
  const formattedTime = date.format("DD-MM--YYYY h:mm:ss A");
  return formattedTime;
}

export function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

export function moveFile(fileName) {
  // Define the paths for the source and destination files
  const sourceFilePath = `./${fileName}`;
  const destinationFolderPath = "./assets";

  // Create the destination folder if it doesn't exist
  if (!fs.existsSync(destinationFolderPath)) {
    fs.mkdirSync(destinationFolderPath);
  }

  // Construct the destination file path
  const destinationFilePath = path.join(destinationFolderPath, fileName);

  // Check if the source file exists
  if (fs.existsSync(sourceFilePath)) {
    try {
      // Move the source file to the destination folder
      fs.renameSync(sourceFilePath, destinationFilePath);
      console.log(`File moved to ${destinationFilePath}`);
      // fs.unlinkSync(sourceFilePath);
      //   console.log(`Original file removed: ${sourceFilePath}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  } else {
    console.error(`Source file not found: ${sourceFilePath}`);
  }
}

export function log(projectName, projectId, message, options = {}) {
  const timestamp = convertIsoToAmPm(new Date().toISOString());
  const filePath = "logs.txt";
  let errorMessage =
    `${projectName}----${projectId}------${message}-------at ${timestamp}` +
    "\n";
  const seperator = `\n--------------------------------------------------${projectName}------------------------------------------------------------------------\n`;
  if (options?.seperator) {
    errorMessage = seperator + errorMessage;
  }

  fs.appendFile(filePath, errorMessage, (err) => {
    if (err) {
      console.error("Error writing to the file:", err);
    }
  });
}

export function writeLogToFile(message, stage, filePath = "log.txt") {
  // Add a timestamp to the log entry
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  const timestamp = convertIsoToAmPm(new Date().toISOString());
  const logEntry = `[${timestamp}]\n Error Occured At Stage ${stage} \n${message}\n`;

  fs.writeFileSync(path.join(filePath, "logs.txt"), logEntry, "utf8");
}

export function makeProjectNameCompatible(projectName) {
  // Replace any character that is not a letter, number, space, hyphen, exclamation mark, single quote, or double quote with a hyphen
  return projectName.replace(/[^a-zA-Z0-9\s-!'"']/g, "").substring(0, 30);
}

export function generateProjectId(projectName) {
  // Replace any character that is not a number, letter, or hyphen with a hyphen
  const projectId = `${projectName.replace(/[^a-zA-Z0-9-]/g, "-")}-${randomInt(
    1000,
    9999
  )}`
    .substring(0, 30)
    .toLowerCase();
  if (/^\d/.test(projectId)) {
    return `app-${projectId}`;
  }
  return projectId;
}
