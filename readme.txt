=== INSTALL DEPENDENCIES ===
npm init -y
npm install express sqlite3
npm install -D typescript ts-node-dev
npx tsc --init
npm install nodemon


=== RUN ===
npx nodemon server.ts



=== Docker ===
docker build . -t tripbooking
docker run -d --name tripbooking -p 8888:3000  tripbooking


==== git ====
git status  
git add .
git add path/to/file
git commit -m "updated: 9.54 pm"
git push origin main

=== first push project ===
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main