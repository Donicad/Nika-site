/* script.js — toda a lógica JS do site (AOS init, smooth scroll, form handling, validação) */

(function () {
    "use strict";

    // ---------- Inicialização após DOM carregado
    document.addEventListener("DOMContentLoaded", () => {
        // AOS init
        if (window.AOS) AOS.init({ duration: 800, once: true, easing: "ease-in-out" });

        initSmoothScroll();
        initContactForm();
    });

    // ---------- Smooth scroll (links âncora)
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener("click", function (e) {
                const href = this.getAttribute("href");
                if (!href || href === "#") return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }

    // ---------- Form handling + validações
    function initContactForm() {
        const form = document.getElementById("lead-form");
        if (!form) return;

        const feedback = document.getElementById("form-feedback");
        const submitBtn = document.getElementById("submit-btn");
        const endpoint = (form.dataset && form.dataset.endpoint) ? form.dataset.endpoint.trim() : "";

        // Pequena lista de domínios descartáveis (exemplo). Não é completa.
        const disposableDomains = new Set([
            "mailinator.com", "10minutemail.com", "tempmail.com", "guerrillamail.com",
            "yopmail.com", "trashmail.com", "dispostable.com", "maildrop.cc"
        ]);

        form.addEventListener("submit", async (e) => {
            // honeypot: se preenchido -> provavelmente bot
            const gotcha = form.querySelector('input[name="_gotcha"]');
            if (gotcha && gotcha.value) {
                e.preventDefault();
                showFeedback("Envio detectado como spam.", "red");
                return;
            }

            // Se não tem endpoint configurado, deixa o browser submeter (fallback)
            if (!endpoint) {
                // não intervir — assume que action do form está correta
                return;
            }

            e.preventDefault();

            // Validação simples
            const formData = new FormData(form);
            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("email") || "").trim().toLowerCase();
            const message = String(formData.get("message") || "").trim();

            if (!name || !email) {
                showFeedback("Por favor, preencha nome e e-mail.", "red");
                return;
            }

            // Validação sintática do e-mail (boa prática: não excessivamente restritiva)
            if (!isValidEmail(email)) {
                showFeedback("Parece que o e-mail é inválido. Verifique o formato.", "red");
                return;
            }

            // Bloqueio simples de domínios descartáveis
            const domain = email.split("@")[1] || "";
            if (disposableDomains.has(domain)) {
                showFeedback("Por favor, use um e-mail real (não descartável).", "red");
                return;
            }

            // All checks passed -> enviar via fetch para Formspree
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Enviando...";

            try {
                const payload = {};
                formData.forEach((v, k) => payload[k] = v);

                // fetch para endpoint (Formspree espera JSON com Accept: application/json)
                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Accept": "application/json", "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showFeedback("✅ Mensagem enviada! Vou responder em breve.", "green");
                    form.reset();
                } else {
                    // tenta extrair mensagem do corpo de resposta
                    let msg = "Ocorreu um erro. Tente novamente ou me chame no WhatsApp.";
                    try {
                        const data = await res.json();
                        if (data && (data.error || data.message)) msg = data.error || data.message;
                    } catch (_) {
                        // fallback
                    }
                    showFeedback(msg, "red");
                }
            } catch (err) {
                console.error("Form submit error:", err);
                showFeedback("Erro de rede. Tente novamente em alguns instantes.", "red");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        function showFeedback(txt, color) {
            if (!feedback) {
                alert(txt); // fallback
                return;
            }
            feedback.textContent = txt;
            if (color === "green") feedback.style.color = "#00b894";
            else if (color === "red") feedback.style.color = "#ff6b6b";
            else feedback.style.color = "";
        }

        // Validação de e-mail — regex simples e prática
        function isValidEmail(email) {
            // formato básico e garante ao menos um dot no domínio e TLD >=2
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
            if (!re.test(email)) return false;

            // evita emails com caracteres estranhos no domínio (simplifica)
            const parts = email.split("@");
            if (parts.length !== 2) return false;
            const domain = parts[1].toLowerCase();

            // proibir espaços, start/end com "-" no domain label etc — checagem simples:
            if (domain.startsWith("-") || domain.endsWith("-")) return false;
            if (!domain.includes(".")) return false;

            return true;
        }
    }

})();
