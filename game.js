function paintGame() {
    const body = document.querySelector('body');
    body.style.backgroundColor = 'black';
    const box = document.createElement('div');
    box.style.width = '100vw';
    box.style.height = '100vh';
    box.style.backgroundColor = 'red';
    body.appendChild(box);
    const shooter = document.createElement('div');
    shooter.style.width = '50px';
    shooter.style.height = '50px';
    shooter.style.backgroundColor = 'blue';
    shooter.style.position = 'absolute';
    shooter.style.bottom = '0';
    shooter.style.left = '50%';
    box.appendChild(shooter);
    const enemy = document.createElement('div');
    enemy.style.width = '100vw';
    enemy.style.height = '50vh';
    enemy.style.backgroundColor = 'black';
    enemy.style.position = 'absolute';
    enemy.style.top = '0';
    box.appendChild(enemy);

}
paintGame();