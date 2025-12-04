import bcrypt from "bcryptjs";

async function main() {
  const password = "MyStrongPass123!"; // set your desired password here
  const hash = await bcrypt.hash(password, 10);
  console.log("Hash:", hash);
}

main();
