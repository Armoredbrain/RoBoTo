import { exec } from "child_process";

exec("husky install");
exec('npx husky add .husky/pre-commit "yarn prettier:fix" && npx husky add .husky/pre-commit "yarn lint"');
exec('npx husky add .husky/pre-push "yarn test --coverage" && npx husky add .husky/pre-push "yarn build"');
