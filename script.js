document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle"); // seleciona o ícone
    const menu = document.querySelector(".menu"); // seleciona o ul.menu

    menuToggle.addEventListener("click", () => {
        menu.classList.toggle("show"); // mostra/esconde o menu
        // troca o ícone do menu
        const icon = menuToggle.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
    });
});
