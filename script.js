(() => {
  const STORAGE_KEYS = {
    PRODUCTS: "vibe_store_products",
    USERS: "vibe_store_users",
    CURRENT_USER_ID: "vibe_store_current_user_id",
    CARTS: "vibe_store_carts",
    ORDERS: "vibe_store_orders"
  };

  const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";

  const LOGIN_PAGE_URL = "./login.html";
  const ADMIN_PAGE_URL = "./admin.html";

  const state = {
    selectedCategory: "전체",
    searchKeyword: "",
    sort: "latest",
    selectedProductId: null
  };

  const $ = (selector) => document.querySelector(selector);

  const el = {
    logoBtn: $("#logoBtn"),
    searchForm: $("#searchForm"),
    searchInput: $("#searchInput"),
    cartBtn: $("#cartBtn"),
    cartBadge: $("#cartBadge"),
    mypageBtn: $("#mypageBtn"),
    logoutBtn: $("#logoutBtn"),
    adminBtn: $("#adminBtn"),
    categoryTabs: $("#categoryTabs"),
    sortSelect: $("#sortSelect"),
    productCount: $("#productCount"),
    productGrid: $("#productGrid"),
    emptyState: $("#emptyState"),

    productModal: $("#productModal"),
    productModalBody: $("#productModalBody"),
    cartModal: $("#cartModal"),
    cartModalBody: $("#cartModalBody")
  };

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function safeJSONParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function load(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return safeJSONParse(raw, fallback);
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function sanitizeNumber(value, min = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.max(min, Math.floor(num));
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatPrice(value) {
    const num = sanitizeNumber(value, 0);
    if (num === 0) return "무료";
    return `${num.toLocaleString("ko-KR")}원`;
  }

  function calcDiscountRate(price, originalPrice) {
    const sale = sanitizeNumber(price, 0);
    const original = sanitizeNumber(originalPrice, 0);
    if (original <= 0 || sale >= original) return 0;
    return Math.round(((original - sale) / original) * 100);
  }

  function redirectToLogin(withAlert = true) {
    if (withAlert) {
      alert("로그인이 필요한 서비스입니다.");
    }
    location.href = LOGIN_PAGE_URL;
  }

  function getInitialProducts() {
    const now = Date.now();
    return [
      {
        id: uid("product"),
        name: "프리미엄 무선 이어버드 노이즈캔슬링 에디션",
        category: "전자기기",
        price: 129000,
        originalPrice: 159000,
        image:
          "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=900&q=80",
        badge: "무료배송",
        description: "선명한 사운드와 강력한 배터리를 제공하는 프리미엄 무선 이어버드입니다.",
        createdAt: now - 1000 * 60 * 60 * 24 * 1,
        options: [
          { id: uid("opt"), name: "화이트", stock: 8 },
          { id: uid("opt"), name: "블랙", stock: 5 }
        ]
      },
      {
        id: uid("product"),
        name: "데일리 러닝 쿠셔닝 운동화",
        category: "패션",
        price: 89000,
        originalPrice: 109000,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        badge: "쿠폰적용",
        description: "가벼운 착화감과 쿠셔닝이 좋은 러닝 운동화입니다.",
        createdAt: now - 1000 * 60 * 60 * 24 * 2,
        options: [
          { id: uid("opt"), name: "230", stock: 2 },
          { id: uid("opt"), name: "240", stock: 0 },
          { id: uid("opt"), name: "250", stock: 7 }
        ]
      },
      {
        id: uid("product"),
        name: "홈카페 드립백 커피 30개입",
        category: "식품",
        price: 19900,
        originalPrice: 24900,
        image:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
        badge: "특가",
        description: "언제 어디서나 간편하게 즐기는 드립백 커피 세트입니다.",
        createdAt: now - 1000 * 60 * 60 * 24 * 3,
        options: [
          { id: uid("opt"), name: "다크로스트", stock: 15 },
          { id: uid("opt"), name: "밸런스드", stock: 10 }
        ]
      },
      {
        id: uid("product"),
        name: "멀티포트 초고속 충전기 65W",
        category: "전자기기",
        price: 0,
        originalPrice: 0,
        image:
          "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80",
        badge: "무료나눔",
        description: "프로모션용 무료 증정 상품입니다.",
        createdAt: now - 1000 * 60 * 60 * 24 * 4,
        options: [{ id: uid("opt"), name: "기본형", stock: 3 }]
      },
      {
        id: uid("product"),
        name: "피부 진정 수분 크림 100ml",
        category: "뷰티",
        price: 32000,
        originalPrice: 45000,
        image:
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
        badge: "1+1 이벤트",
        description: "민감한 피부를 위한 보습 진정 크림입니다.",
        createdAt: now - 1000 * 60 * 60 * 24 * 5,
        options: [
          { id: uid("opt"), name: "단품", stock: 11 },
          { id: uid("opt"), name: "2개세트", stock: 4 }
        ]
      }
    ];
  }

  function ensureStorage() {
    let products = load(STORAGE_KEYS.PRODUCTS, null);
    let users = load(STORAGE_KEYS.USERS, null);
    let carts = load(STORAGE_KEYS.CARTS, null);
    let orders = load(STORAGE_KEYS.ORDERS, null);

    if (!Array.isArray(products) || products.length === 0) {
      save(STORAGE_KEYS.PRODUCTS, getInitialProducts());
    }

    if (!Array.isArray(users)) {
      users = [];
    }

    const hasAdmin = users.some((user) => user.id === "admin");
    if (!hasAdmin) {
      users.push({
        id: "admin",
        password: "admin",
        nickname: "관리자",
        role: "admin",
        balance: 999999999,
        createdAt: Date.now()
      });
    }
    save(STORAGE_KEYS.USERS, users);

    if (!carts || typeof carts !== "object" || Array.isArray(carts)) {
      save(STORAGE_KEYS.CARTS, {});
    }

    if (!Array.isArray(orders)) {
      save(STORAGE_KEYS.ORDERS, []);
    }
  }

  function getProducts() {
    const products = load(STORAGE_KEYS.PRODUCTS, []);
    return Array.isArray(products) ? products : [];
  }

  function setCurrentUserId(id) {
    if (!id) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  function getUsers() {
    const users = load(STORAGE_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  }

  function getCurrentUserId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || "";
  }

  function getCurrentUser() {
    const userId = getCurrentUserId();
    if (!userId) return null;
    return getUsers().find((user) => user.id === userId) || null;
  }

  function logout() {
    setCurrentUserId("");
    alert("로그아웃되었습니다.");
    renderView();
  }

  function getCartsMap() {
    const carts = load(STORAGE_KEYS.CARTS, {});
    if (!carts || typeof carts !== "object" || Array.isArray(carts)) return {};
    return carts;
  }

  function setCartsMap(carts) {
    save(STORAGE_KEYS.CARTS, carts);
  }

  function getCartByUserId(userId) {
    if (!userId) return [];
    const carts = getCartsMap();
    const cart = carts[userId];
    return Array.isArray(cart) ? cart : [];
  }

  function setCartByUserId(userId, cartItems) {
    if (!userId) return;
    const carts = getCartsMap();
    carts[userId] = Array.isArray(cartItems) ? cartItems : [];
    setCartsMap(carts);
  }

  function getAllCategories() {
    const products = getProducts();
    const set = new Set(["전체"]);
    products.forEach((product) => {
      if (normalizeText(product.category)) {
        set.add(product.category);
      }
    });
    return Array.from(set);
  }

  function getProductById(productId) {
    return getProducts().find((product) => product.id === productId) || null;
  }

  function getOptionById(product, optionId) {
    if (!product || !Array.isArray(product.options)) return null;
    return product.options.find((opt) => opt.id === optionId) || null;
  }

  function getTotalStock(product) {
    if (!product || !Array.isArray(product.options)) return 0;
    return product.options.reduce((sum, opt) => sum + sanitizeNumber(opt.stock, 0), 0);
  }

  function getFilteredProducts() {
    const products = [...getProducts()];
    const keyword = normalizeText(state.searchKeyword);
    const selectedCategory = state.selectedCategory;

    let filtered = products.filter((product) => {
      const byCategory = selectedCategory === "전체" || product.category === selectedCategory;
      const byKeyword = !keyword || normalizeText(product.name).includes(keyword);
      return byCategory && byKeyword;
    });

    filtered.sort((a, b) => {
      if (state.sort === "latest") {
        return sanitizeNumber(b.createdAt, 0) - sanitizeNumber(a.createdAt, 0);
      }

      if (state.sort === "priceAsc") {
        const diff = sanitizeNumber(a.price, 0) - sanitizeNumber(b.price, 0);
        if (diff === 0) {
          return sanitizeNumber(b.createdAt, 0) - sanitizeNumber(a.createdAt, 0);
        }
        return diff;
      }

      if (state.sort === "priceDesc") {
        const diff = sanitizeNumber(b.price, 0) - sanitizeNumber(a.price, 0);
        if (diff === 0) {
          return sanitizeNumber(b.createdAt, 0) - sanitizeNumber(a.createdAt, 0);
        }
        return diff;
      }

      if (state.sort === "nameAsc") {
        return String(a.name).localeCompare(String(b.name), "ko");
      }

      return sanitizeNumber(b.createdAt, 0) - sanitizeNumber(a.createdAt, 0);
    });

    return filtered;
  }

  function getCartCount() {
    const user = getCurrentUser();
    if (!user) return 0;
    return getCartByUserId(user.id).reduce((sum, item) => sum + sanitizeNumber(item.quantity, 0), 0);
  }

  function getCartDetailedItems(userId) {
    const cart = getCartByUserId(userId);

    return cart
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) return null;

        const option = getOptionById(product, item.optionId);
        if (!option) return null;

        const price = sanitizeNumber(product.price, 0);
        const quantity = sanitizeNumber(item.quantity, 1);
        const stock = sanitizeNumber(option.stock, 0);

        return {
          ...item,
          product,
          option,
          price,
          quantity,
          stock,
          subtotal: price * quantity
        };
      })
      .filter(Boolean);
  }

  function renderCategories() {
    const categories = getAllCategories();
    el.categoryTabs.innerHTML = categories
      .map((category) => {
        const isActive = category === state.selectedCategory;
        return `
          <button
            class="category-tab ${isActive ? "active" : ""}"
            type="button"
            data-category="${escapeHTML(category)}"
          >
            ${escapeHTML(category)}
          </button>
        `;
      })
      .join("");
  }

  function renderProducts() {
    const products = getFilteredProducts();
    el.productCount.textContent = String(products.length);

    if (!products.length) {
      el.productGrid.innerHTML = "";
      el.emptyState.classList.remove("hidden");
      return;
    }

    el.emptyState.classList.add("hidden");

    el.productGrid.innerHTML = products
      .map((product) => {
        const discountRate = calcDiscountRate(product.price, product.originalPrice);
        const totalStock = getTotalStock(product);
        const soldOut = totalStock <= 0;

        return `
          <article class="product-card">
            <button class="product-card-btn" type="button" data-product-id="${product.id}">
              <div class="product-thumb-wrap">
                <img
                  class="product-thumb"
                  src="${escapeHTML(product.image || DEFAULT_IMAGE)}"
                  alt="${escapeHTML(product.name)}"
                  loading="lazy"
                  onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
                />
                <span class="stock-overlay">${soldOut ? "품절" : `재고 ${totalStock}개`}</span>
              </div>

              <div class="product-info">
                <div class="product-category">${escapeHTML(product.category)}</div>
                <h3 class="product-name">${escapeHTML(product.name)}</h3>

                <div class="price-row">
                  <span class="sale-price">${formatPrice(product.price)}</span>
                  ${
                    sanitizeNumber(product.originalPrice, 0) > 0
                      ? `<span class="original-price">${sanitizeNumber(product.originalPrice, 0).toLocaleString("ko-KR")}원</span>`
                      : ""
                  }
                  ${discountRate > 0 ? `<span class="discount-rate">${discountRate}%</span>` : ""}
                </div>

                <div class="badge-row">
                  ${product.badge ? `<span class="badge">${escapeHTML(product.badge)}</span>` : ""}
                  ${soldOut ? `<span class="badge soldout-badge">품절</span>` : ""}
                </div>
              </div>
            </button>
          </article>
        `;
      })
      .join("");
  }

  function renderHeaderState() {
    const user = getCurrentUser();
    const isAdmin = user?.role === "admin";

    el.cartBadge.textContent = String(getCartCount());
    el.adminBtn.classList.toggle("hidden", !isAdmin);
    el.logoutBtn.classList.toggle("hidden", !user);
    el.mypageBtn.textContent = user ? `${user.nickname}님` : "마이페이지";
  }

  function renderView() {
    renderHeaderState();
    renderCategories();
    renderProducts();
  }

  function resetToHome() {
    state.selectedCategory = "전체";
    state.searchKeyword = "";
    state.sort = "latest";

    if (el.searchInput) el.searchInput.value = "";
    if (el.sortSelect) el.sortSelect.value = "latest";

    renderView();
  }

  function openProductModal(productId) {
    const product = getProductById(productId);
    if (!product) {
      alert("상품 정보를 찾을 수 없습니다.");
      return;
    }

    state.selectedProductId = productId;
    const totalStock = getTotalStock(product);
    const firstAvailableOption = (product.options || []).find(
      (opt) => sanitizeNumber(opt.stock, 0) > 0
    );

    el.productModalBody.innerHTML = `
      <div class="detail-layout">
        <div class="detail-thumb">
          <img
            src="${escapeHTML(product.image || DEFAULT_IMAGE)}"
            alt="${escapeHTML(product.name)}"
            onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'"
          />
        </div>

        <div class="detail-info">
          <p class="muted">${escapeHTML(product.category)}</p>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${escapeHTML(product.description || "상품 설명이 없습니다.")}</p>

          <div class="price-row">
            <span class="sale-price">${formatPrice(product.price)}</span>
            ${
              sanitizeNumber(product.originalPrice, 0) > 0
                ? `<span class="original-price">${sanitizeNumber(product.originalPrice, 0).toLocaleString("ko-KR")}원</span>`
                : ""
            }
            ${
              calcDiscountRate(product.price, product.originalPrice) > 0
                ? `<span class="discount-rate">${calcDiscountRate(product.price, product.originalPrice)}%</span>`
                : ""
            }
          </div>

          <div class="badge-row">
            ${product.badge ? `<span class="badge">${escapeHTML(product.badge)}</span>` : ""}
            ${totalStock <= 0 ? `<span class="badge soldout-badge">품절</span>` : ""}
          </div>

          <div class="option-box" style="margin-top:14px;">
            <div class="form-row">
              <label for="detailOptionSelect">옵션 선택</label>
              <select id="detailOptionSelect" ${totalStock <= 0 ? "disabled" : ""}>
                ${(product.options || [])
                  .map((opt) => {
                    const stock = sanitizeNumber(opt.stock, 0);
                    return `
                      <option
                        value="${opt.id}"
                        ${stock <= 0 ? "disabled" : ""}
                        ${firstAvailableOption?.id === opt.id ? "selected" : ""}
                      >
                        ${escapeHTML(opt.name)} ${stock <= 0 ? "(품절)" : `(재고 ${stock}개)`}
                      </option>
                    `;
                  })
                  .join("")}
              </select>
            </div>

            <p id="detailStockText" class="stock-text"></p>

            <div class="quantity-row">
              <label for="detailQtyInput">수량</label>
              <input
                id="detailQtyInput"
                type="number"
                min="1"
                step="1"
                value="1"
                ${totalStock <= 0 ? "disabled" : ""}
              />
            </div>

            <button
              id="addToCartBtn"
              class="primary-btn full-btn"
              type="button"
              ${totalStock <= 0 ? "disabled" : ""}
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    `;

    syncDetailQuantityLimit();
    el.productModal.classList.remove("hidden");
    el.productModal.setAttribute("aria-hidden", "false");
  }

  function closeProductModal() {
    state.selectedProductId = null;
    el.productModal.classList.add("hidden");
    el.productModal.setAttribute("aria-hidden", "true");
    el.productModalBody.innerHTML = "";
  }

  function syncDetailQuantityLimit() {
    const product = getProductById(state.selectedProductId);
    const optionSelect = $("#detailOptionSelect");
    const qtyInput = $("#detailQtyInput");
    const stockText = $("#detailStockText");
    const addToCartBtn = $("#addToCartBtn");

    if (!product || !optionSelect || !qtyInput || !stockText || !addToCartBtn) return;

    const option = getOptionById(product, optionSelect.value);
    const stock = sanitizeNumber(option?.stock, 0);

    stockText.textContent = option
      ? `선택 옵션 재고: ${stock}개`
      : "선택 가능한 옵션이 없습니다.";

    qtyInput.max = String(Math.max(stock, 1));

    if (stock <= 0) {
      qtyInput.value = "1";
      qtyInput.disabled = true;
      addToCartBtn.disabled = true;
      return;
    }

    qtyInput.disabled = false;
    addToCartBtn.disabled = false;

    let currentQty = sanitizeNumber(qtyInput.value, 1);
    if (currentQty > stock) {
      currentQty = stock;
      qtyInput.value = String(stock);
    }
    if (currentQty < 1) {
      qtyInput.value = "1";
    }
  }

  function addToCart(productId, optionId, quantity) {
    const user = getCurrentUser();
    if (!user) {
      closeProductModal();
      redirectToLogin(true);
      return;
    }

    const product = getProductById(productId);
    if (!product) {
      alert("상품 정보가 존재하지 않습니다.");
      return;
    }

    const option = getOptionById(product, optionId);
    if (!option) {
      alert("옵션 정보가 존재하지 않습니다.");
      return;
    }

    const stock = sanitizeNumber(option.stock, 0);
    const safeQty = sanitizeNumber(quantity, 1);

    if (stock <= 0) {
      alert("해당 옵션은 품절입니다.");
      return;
    }

    const cart = getCartByUserId(user.id);
    const existingIndex = cart.findIndex(
      (item) => item.productId === productId && item.optionId === optionId
    );

    let nextQty = safeQty;
    if (existingIndex > -1) {
      nextQty += sanitizeNumber(cart[existingIndex].quantity, 0);
    }

    if (nextQty > stock) {
      alert(`재고를 초과할 수 없습니다. 현재 재고는 ${stock}개입니다.`);
      if (existingIndex > -1) {
        cart[existingIndex].quantity = stock;
        setCartByUserId(user.id, cart);
        renderHeaderState();
      }
      return;
    }

    if (existingIndex > -1) {
      cart[existingIndex].quantity = nextQty;
    } else {
      cart.push({
        id: uid("cart"),
        productId,
        optionId,
        quantity: safeQty,
        addedAt: Date.now()
      });
    }

    setCartByUserId(user.id, cart);
    renderHeaderState();
    alert("장바구니에 담았습니다.");
    closeProductModal();
  }

  function openCartModal() {
    const user = getCurrentUser();
    if (!user) {
      redirectToLogin(true);
      return;
    }

    renderCartModal();
    el.cartModal.classList.remove("hidden");
    el.cartModal.setAttribute("aria-hidden", "false");
  }

  function closeCartModal() {
    el.cartModal.classList.add("hidden");
    el.cartModal.setAttribute("aria-hidden", "true");
    el.cartModalBody.innerHTML = "";
  }

  function renderCartModal() {
    const user = getCurrentUser();
    if (!user) return;

    const items = getCartDetailedItems(user.id);

    if (!items.length) {
      el.cartModalBody.innerHTML = `
        <div class="empty-state">장바구니가 비어 있습니다.</div>
      `;
      return;
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    el.cartModalBody.innerHTML = `
      <div class="cart-list">
        ${items
          .map((item) => {
            return `
              <div class="cart-item">
                <div class="cart-item-top">
                  <div>
                    <p><strong>${escapeHTML(item.product.name)}</strong></p>
                    <p class="muted">옵션: ${escapeHTML(item.option.name)}</p>
                    <p class="muted">단가: ${formatPrice(item.price)}</p>
                    <p class="${item.stock <= 0 ? "warning" : "muted"}">현재 재고: ${item.stock}개</p>
                  </div>
                  <button
                    class="danger-btn"
                    type="button"
                    data-remove-cart-id="${item.id}"
                  >
                    삭제
                  </button>
                </div>

                <div class="cart-item-controls">
                  <label>
                    수량
                    <input
                      type="number"
                      min="1"
                      step="1"
                      max="${Math.max(item.stock, 1)}"
                      value="${item.quantity}"
                      data-cart-qty-id="${item.id}"
                    />
                  </label>
                  <strong>합계: ${item.subtotal.toLocaleString("ko-KR")}원</strong>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>

      <div class="cart-summary">
        <p><strong>보유 잔액:</strong> ${sanitizeNumber(user.balance, 0).toLocaleString("ko-KR")}원</p>
        <p><strong>총 결제 금액:</strong> ${total.toLocaleString("ko-KR")}원</p>
        <button id="checkoutBtn" class="primary-btn full-btn" type="button">일괄 결제</button>
      </div>
    `;
  }

  function updateCartQuantity(cartId, rawQty) {
    const user = getCurrentUser();
    if (!user) return;

    const cart = getCartByUserId(user.id);
    const target = cart.find((item) => item.id === cartId);
    if (!target) return;

    const product = getProductById(target.productId);
    const option = getOptionById(product, target.optionId);
    const stock = sanitizeNumber(option?.stock, 0);

    let qty = sanitizeNumber(rawQty, 1);

    if (stock <= 0) {
      alert("해당 옵션은 현재 품절입니다. 삭제 후 다른 옵션을 선택해 주세요.");
      qty = 1;
    }

    if (qty > stock && stock > 0) {
      alert(`재고를 초과할 수 없습니다. 최대 ${stock}개까지 가능합니다.`);
      qty = stock;
    }

    target.quantity = qty;
    setCartByUserId(user.id, cart);
    renderHeaderState();
    renderCartModal();
  }

  function removeCartItem(cartId) {
    const user = getCurrentUser();
    if (!user) return;

    const cart = getCartByUserId(user.id).filter((item) => item.id !== cartId);
    setCartByUserId(user.id, cart);
    renderHeaderState();
    renderCartModal();
  }

  function checkout() {
    const user = getCurrentUser();
    if (!user) {
      redirectToLogin(true);
      return;
    }

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex === -1) {
      alert("유저 정보가 존재하지 않습니다.");
      return;
    }

    const cart = getCartByUserId(user.id);
    if (!cart.length) {
      alert("장바구니가 비어 있습니다.");
      return;
    }

    const products = getProducts();
    const orders = load(STORAGE_KEYS.ORDERS, []);

    let total = 0;
    const orderDrafts = [];

    for (const cartItem of cart) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        alert("장바구니에 존재하지 않는 상품이 포함되어 있습니다.");
        return;
      }

      const option = (product.options || []).find((opt) => opt.id === cartItem.optionId);
      if (!option) {
        alert(`"${product.name}"의 옵션 정보가 유효하지 않습니다.`);
        return;
      }

      const stock = sanitizeNumber(option.stock, 0);
      const qty = sanitizeNumber(cartItem.quantity, 1);

      if (stock < qty) {
        alert(`"${product.name} - ${option.name}" 재고가 부족합니다. 현재 재고: ${stock}개`);
        renderCartModal();
        return;
      }

      const subtotal = sanitizeNumber(product.price, 0) * qty;
      total += subtotal;

      orderDrafts.push({
        id: uid("order"),
        userId: user.id,
        productId: product.id,
        productName: product.name,
        optionId: option.id,
        optionName: option.name,
        quantity: qty,
        paidAmount: subtotal,
        orderedAt: Date.now()
      });
    }

    if (sanitizeNumber(users[userIndex].balance, 0) < total) {
      alert("보유 잔액이 부족하여 결제할 수 없습니다.");
      return;
    }

    users[userIndex].balance = sanitizeNumber(users[userIndex].balance, 0) - total;

    for (const cartItem of cart) {
      const product = products.find((p) => p.id === cartItem.productId);
      const option = (product.options || []).find((opt) => opt.id === cartItem.optionId);
      option.stock = sanitizeNumber(option.stock, 0) - sanitizeNumber(cartItem.quantity, 1);
    }

    orders.push(...orderDrafts);

    save(STORAGE_KEYS.USERS, users);
    save(STORAGE_KEYS.PRODUCTS, products);
    save(STORAGE_KEYS.ORDERS, orders);
    setCartByUserId(user.id, []);

    alert("결제가 완료되었습니다.");
    closeCartModal();
    closeProductModal();
    renderView();
  }

  function bindEvents() {
    el.logoBtn?.addEventListener("click", resetToHome);

    el.searchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      state.searchKeyword = normalizeText(el.searchInput?.value);
      renderView();
    });

    el.sortSelect?.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderProducts();
    });

    el.categoryTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.selectedCategory = button.dataset.category;
      renderView();
    });

    el.productGrid?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-id]");
      if (!button) return;
      openProductModal(button.dataset.productId);
    });

    el.productModal?.addEventListener("click", (event) => {
      if (event.target.dataset.close === "product") {
        closeProductModal();
      }
    });

    el.cartModal?.addEventListener("click", (event) => {
      if (event.target.dataset.close === "cart") {
        closeCartModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeProductModal();
        closeCartModal();
      }
    });

    el.productModal?.addEventListener("change", (event) => {
      if (event.target.id === "detailOptionSelect") {
        syncDetailQuantityLimit();
      }
    });

    el.productModal?.addEventListener("input", (event) => {
      if (event.target.id === "detailQtyInput") {
        const product = getProductById(state.selectedProductId);
        const optionId = $("#detailOptionSelect")?.value;
        const option = getOptionById(product, optionId);
        const stock = sanitizeNumber(option?.stock, 0);

        let qty = sanitizeNumber(event.target.value, 1);
        if (qty > stock && stock > 0) {
          alert(`최대 ${stock}개까지 선택 가능합니다.`);
          qty = stock;
        }
        if (qty < 1) qty = 1;
        event.target.value = String(qty);
      }
    });

    el.productModal?.addEventListener("click", (event) => {
      if (event.target.id === "addToCartBtn") {
        const product = getProductById(state.selectedProductId);
        const optionSelect = $("#detailOptionSelect");
        const qtyInput = $("#detailQtyInput");

        if (!product || !optionSelect || !qtyInput) return;
        addToCart(product.id, optionSelect.value, qtyInput.value);
      }
    });

    el.cartBtn?.addEventListener("click", openCartModal);

    el.cartModal?.addEventListener("input", (event) => {
      const input = event.target.closest("[data-cart-qty-id]");
      if (!input) return;
      updateCartQuantity(input.dataset.cartQtyId, input.value);
    });

    el.cartModal?.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("[data-remove-cart-id]");
      if (removeBtn) {
        removeCartItem(removeBtn.dataset.removeCartId);
        return;
      }

      if (event.target.id === "checkoutBtn") {
        checkout();
      }
    });

    el.mypageBtn?.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) {
        redirectToLogin(true);
        return;
      }
      location.href = LOGIN_PAGE_URL;
    });

    el.logoutBtn?.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user) {
        renderHeaderState();
        return;
      }
      logout();
    });

    el.adminBtn?.addEventListener("click", () => {
      const user = getCurrentUser();

      // [방어 로직]: 관리자 권한 없는 사용자는 이동 차단
      if (!user || user.role !== "admin") {
        alert("관리자 권한이 필요합니다.");
        return;
      }

      location.href = ADMIN_PAGE_URL;
    });
  }

  function init() {
    ensureStorage();
    bindEvents();
    renderView();
  }

  init();
})();