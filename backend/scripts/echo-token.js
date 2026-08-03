const CUSTOM_TOKEN = process.argv[2];
if (!CUSTOM_TOKEN) {
  console.error('token required');
  process.exit(1);
}
console.log(CUSTOM_TOKEN);
