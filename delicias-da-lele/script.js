// ==========================================
// STATE & VARIABLES
// ==========================================
let cart = [];
const WPP_NUMBER = "5519997481943"; // Número real do WhatsApp

// ==========================================
// DOM ELEMENTS
// ==========================================
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartOverlay = document.getElementById('cartOverlay');
const cartSidebar = document.getElementById('cartSidebar');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const toast = document.getElementById('toast');
const deliveryRadios = document.querySelectorAll('input[name="deliveryOption"]');
const addressField = document.getElementById('addressField');

// ==========================================
// CART LOGIC
// ==========================================

// Open & Close Sidebar
cartBtn.addEventListener('click', () => {
    cartOverlay.classList.add('active');
    cartSidebar.classList.add('active');
});

const closeCart = () => {
    cartOverlay.classList.remove('active');
    cartSidebar.classList.remove('active');
};

closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Format Currency
const formatToBRL = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Toggle Address Field
deliveryRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'Entrega (Delivery)') {
            addressField.style.display = 'block';
        } else {
            addressField.style.display = 'none';
        }
    });
});

// Update UI
const updateCartUI = () => {
    // 1. Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    // 2. Render Items
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio. ☹️</div>';
        checkoutBtn.disabled = true;
        cartTotalPrice.textContent = "R$ 0,00";
        return;
    }

    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatToBRL(item.price)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn minus" data-id="${item.id}">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn plus" data-id="${item.id}">+</button>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    // 3. Update Total
    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalPrice.textContent = formatToBRL(totalValue);
    
    // 4. Enable Checkout
    checkoutBtn.disabled = false;

    // Bind events to new dynamic elements
    bindCartItemEvents();
};

// Add to Cart from Page
addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const id = e.target.closest('.add-to-cart').dataset.id;
        const name = e.target.closest('.add-to-cart').dataset.name;
        const price = parseFloat(e.target.closest('.add-to-cart').dataset.price);

        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }

        updateCartUI();
        showToast();
        
        // Small animation on button
        const btn = e.target.closest('.add-to-cart');
        btn.innerHTML = '<i class="ri-check-line"></i> Adicionado';
        setTimeout(() => {
            btn.innerHTML = '<i class="ri-shopping-cart-2-add-line"></i> Adicionar';
        }, 1500);
    });
});

// Attach events to item quantity and remove buttons
const bindCartItemEvents = () => {
    const plusBtns = document.querySelectorAll('.qty-btn.plus');
    const minusBtns = document.querySelectorAll('.qty-btn.minus');
    const removeBtns = document.querySelectorAll('.cart-item-remove');

    plusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const item = cart.find(item => item.id === id);
            item.quantity += 1;
            updateCartUI();
        });
    });

    minusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const item = cart.find(item => item.id === id);
            if (item.quantity > 1) {
                item.quantity -= 1;
                updateCartUI();
            } else {
                // Remove item if quantity goes to 0
                cart = cart.filter(item => item.id !== id);
                updateCartUI();
            }
        });
    });

    removeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.cart-item-remove').dataset.id;
            cart = cart.filter(item => item.id !== id);
            updateCartUI();
        });
    });
};

// Show Toast Notification
const showToast = () => {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// ==========================================
// WHATSAPP CHECKOUT LOGIC
// ==========================================
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) return;

    let message = "Olá! Gostaria de fazer uma encomenda na *Delícias da Lelê* 🧁\n\n*Meu Pedido:*\n";
    
    cart.forEach(item => {
        message += `- ${item.quantity}x ${item.name} (${formatToBRL(item.price * item.quantity)})\n`;
    });

    const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n*Total: ${formatToBRL(totalValue)}*`;
    
    // Pegar opção de entrega/retirada e endereço
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;
    message += `\n*Método:* ${deliveryOption}`;
    
    if (deliveryOption === 'Entrega (Delivery)') {
        const address = document.getElementById('deliveryAddress').value.trim();
        if (address === '') {
            alert('Por favor, informe seu endereço completo para entrega.');
            return; // Impede o envio se estiver vazio
        }
        message += `\n*Endereço:* ${address}`;
    }
    
    message += "\n\nAguardo confirmação e dados para pagamento! Obrigado(a).";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WPP_NUMBER}?text=${encodedMessage}`;

    // Abrir o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
});

// ==========================================
// NAVIGATION LOGIC (MOBILE MENU)
// ==========================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mainNav = document.getElementById('mainNav');

if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.replace('ri-menu-line', 'ri-close-line');
        } else {
            icon.classList.replace('ri-close-line', 'ri-menu-line');
        }
    });

    // Close menu when clicking any nav link
    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) icon.classList.replace('ri-close-line', 'ri-menu-line');
        });
    });
}
