const http = require('http');
const fs = require('fs');
const process = require('process');

async function runCommand(command) {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
};
const server = http.createServer(async(req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cookie = req.headers.cookie;
    console.log(cookie);
    for await (const [name, value] of url.searchParams) {
        try{
        }catch(e){
            console.log(e)
            if(e.message.includes('No such file or directory')){
                await runCommand(`echo ${value} > ${process.cwd()}/${name}.txt`); 
            }
        }
    }
    await res.writeHead(200, {
        'Content-Type': 'text/plain',
        'set-cookie': 'joel=okokokok'
    });
    await res.end('Hello World\n');
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});