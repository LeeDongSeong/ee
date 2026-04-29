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

  const INDEX_PAGE_URL = "./index.html";
  const LOGIN_PAGE_URL = "./login.html";

  const PAGE_SIZE = {
    orders: 5,
    products: 5
  };

  const state = {
    orderPage: 1,
    productPage: 1
  };

  const $ = (selector) => document.querySelector(selector);

  const el = {
    goStoreBtn: $("#goStoreBtn"),
    goIndexBtn: $("#goIndexBtn"),
    adminUserInfoBtn: $("#adminUserInfoBtn"),
    adminLogoutBtn: $("#adminLogoutBtn"),

    adminOrderList: $("#adminOrderList"),
    adminProductList: $("#adminProductList"),
    orderPagination: $("#orderPagination"),
    productPagination: $("#productPagination"),

    addProductForm: $("#addProductForm"),
    addOptionList: $("#addOptionList"),
    addOptionRowBtn: $("#addOptionRowBtn"),

    editProductModal: $("#editProductModal"),
    editProductForm: $("#editProductForm"),
    editProductId: $("#editProductId"),
    editName: $("#editName"),
    editCategory: $("#editCategory"),
    editPrice: $("#editPrice"),
    editOriginalPrice: $("#editOriginalPrice"),
    editImage: $("#editImage"),
    editBadge: $("#editBadge"),
    editDesc: $("#editDesc"),
    editOptionList: $("#editOptionList"),
    editOptionRowBtn: $("#editOptionRowBtn"),
    cancelEditBtn: $("#cancelEditBtn"),
    closeEditModalBtn: $("#closeEditModalBtn")
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

  function getUsers() {
    const users = load(STORAGE_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  }

  function getCurrentUserId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || "";
  }

  function setCurrentUserId(id) {
    if (!id) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  function getCurrentUser() {
    const userId = getCurrentUserId();
    if (!userId) return null;
    return getUsers().find((user) => user.id === userId) || null;
  }

  function ensureAdminAccess() {
    const user = getCurrentUser();

    // [방어 로직]: 비로그인 사용자는 로그인 페이지로 이동
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      location.href = LOGIN_PAGE_URL;
      return false;
    }

    // [방어 로직]: 관리자 외 접근 차단
    if (user.role !== "admin") {
      alert("관리자 권한이 필요합니다.");
      location.href = INDEX_PAGE_URL;
      return false;
    }

    return true;
  }

  function getProducts() {
    const products = load(STORAGE_KEYS.PRODUCTS, []);
    return Array.isArray(products) ? products : [];
  }

  function setProducts(products) {
    save(STORAGE_KEYS.PRODUCTS, products);
  }

  function getOrders() {
    const orders = load(STORAGE_KEYS.ORDERS, []);
    return Array.isArray(orders) ? orders : [];
  }

  function getCartsMap() {
    const carts = load(STORAGE_KEYS.CARTS, {});
    if (!carts || typeof carts !== "object" || Array.isArray(carts)) return {};
    return carts;
  }

  function setCartsMap(carts) {
    save(STORAGE_KEYS.CARTS, carts);
  }

  function createOptionEditorRow(name = "", stock = 0) {
    return `
      <div class="option-editor-row">
        <input
          type="text"
          class="option-name-input"
          maxlength="30"
          placeholder="옵션명"
          value="${escapeHTML(name)}"
        />
        <input
          type="number"
          class="option-stock-input"
          min="0"
          step="1"
          placeholder="재고"
          value="${sanitizeNumber(stock, 0)}"
        />
        <button type="button" class="remove-option-row-btn">삭제</button>
      </div>
    `;
  }

  function ensureOptionEditorMinimum(container) {
    if (!container.children.length) {
      container.insertAdjacentHTML("beforeend", createOptionEditorRow("", 0));
    }
  }

  function getOptionRowsData(container) {
    const rows = [...container.querySelectorAll(".option-editor-row")];

    return rows
      .map((row) => {
        const name = row.querySelector(".option-name-input")?.value?.trim() || "";
        const stock = sanitizeNumber(row.querySelector(".option-stock-input")?.value, 0);
        return { name, stock };
      })
      .filter((opt) => opt.name);
  }

  function getTotalPages(totalCount, pageSize) {
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }

  function clampPage(page, totalPages) {
    // [방어 로직]: 현재 페이지가 범위를 벗어나면 자동 보정
    return Math.min(Math.max(1, page), totalPages);
  }

  function paginate(items, currentPage, pageSize) {
    const totalPages = getTotalPages(items.length, pageSize);
    const safePage = clampPage(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      items: items.slice(startIndex, endIndex),
      currentPage: safePage,
      totalPages,
      totalCount: items.length
    };
  }

  function renderPagination(container, currentPage, totalPages, type) {
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let pageButtons = "";
    for (let i = 1; i <= totalPages; i += 1) {
      pageButtons += `
        <button
          type="button"
          class="${i === currentPage ? "active" : ""}"
          data-page-type="${type}"
          data-page="${i}"
        >
          ${i}
        </button>
      `;
    }

    container.innerHTML = `
      <button
        type="button"
        data-page-type="${type}"
        data-page="${currentPage - 1}"
        ${currentPage <= 1 ? "disabled" : ""}
      >
        이전
      </button>

      ${pageButtons}

      <button
        type="button"
        data-page-type="${type}"
        data-page="${currentPage + 1}"
        ${currentPage >= totalPages ? "disabled" : ""}
      >
        다음
      </button>
    `;
  }

  function openEditModal() {
    el.editProductModal.classList.remove("hidden");
    el.editProductModal.setAttribute("aria-hidden", "false");
  }

  function closeEditModal() {
    el.editProductModal.classList.add("hidden");
    el.editProductModal.setAttribute("aria-hidden", "true");
    el.editProductForm.reset();
    el.editOptionList.innerHTML = "";
  }

  function renderAdminInfo() {
    const user = getCurrentUser();
    el.adminUserInfoBtn.textContent = user ? `${user.nickname}님` : "관리자";
  }

  function renderAdminOrders() {
    const orders = getOrders().sort(
      (a, b) => sanitizeNumber(b.orderedAt, 0) - sanitizeNumber(a.orderedAt, 0)
    );

    const pageData = paginate(orders, state.orderPage, PAGE_SIZE.orders);
    state.orderPage = pageData.currentPage;

    if (!pageData.items.length) {
      el.adminOrderList.innerHTML = `<div class="order-item muted">주문 내역이 없습니다.</div>`;
      el.orderPagination.innerHTML = "";
      return;
    }

    el.adminOrderList.innerHTML = pageData.items
      .map((order) => {
        return `
          <div class="order-item">
            <p><strong>주문자 ID:</strong> ${escapeHTML(order.userId)}</p>
            <p><strong>상품:</strong> ${escapeHTML(order.productName)}</p>
            <p><strong>옵션:</strong> ${escapeHTML(order.optionName)}</p>
            <p><strong>수량:</strong> ${sanitizeNumber(order.quantity, 1)}개</p>
            <p><strong>결제액:</strong> ${sanitizeNumber(order.paidAmount, 0).toLocaleString("ko-KR")}원</p>
            <p><strong>일시:</strong> ${new Date(order.orderedAt).toLocaleString("ko-KR")}</p>
          </div>
        `;
      })
      .join("");

    renderPagination(el.orderPagination, pageData.currentPage, pageData.totalPages, "orders");
  }

  function renderAdminProducts() {
    const products = getProducts().sort(
      (a, b) => sanitizeNumber(b.createdAt, 0) - sanitizeNumber(a.createdAt, 0)
    );

    const pageData = paginate(products, state.productPage, PAGE_SIZE.products);
    state.productPage = pageData.currentPage;

    if (!pageData.items.length) {
      el.adminProductList.innerHTML = `<div class="order-item muted">등록된 상품이 없습니다.</div>`;
      el.productPagination.innerHTML = "";
      return;
    }

    el.adminProductList.innerHTML = pageData.items
      .map((product) => {
        const optionText = Array.isArray(product.options)
          ? product.options.map((opt) => `${opt.name}(${sanitizeNumber(opt.stock, 0)})`).join(", ")
          : "";

        return `
          <div class="admin-product-item">
            <p><strong>${escapeHTML(product.name)}</strong></p>
            <p class="muted">
              카테고리: ${escapeHTML(product.category)} / 가격: ${sanitizeNumber(product.price, 0).toLocaleString("ko-KR")}원
            </p>
            <p class="muted">옵션: ${escapeHTML(optionText)}</p>
            <div class="inline-actions">
              <button class="secondary-btn" type="button" data-edit-product-id="${product.id}">
                수정하기
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    renderPagination(el.productPagination, pageData.currentPage, pageData.totalPages, "products");
  }

  function addProduct(form) {
    const name = $("#addName").value.trim();
    const category = $("#addCategory").value.trim();
    const price = sanitizeNumber($("#addPrice").value, 0);
    const originalPrice = sanitizeNumber($("#addOriginalPrice").value, 0);
    const image = $("#addImage").value.trim() || DEFAULT_IMAGE;
    const badge = $("#addBadge").value.trim();
    const description = $("#addDesc").value.trim();
    const optionRows = getOptionRowsData(el.addOptionList);

    // [방어 로직]: 필수값 및 옵션 1개 이상 검증
    if (!name || !category) {
      alert("상품명과 카테고리를 입력해 주세요.");
      return;
    }

    if (!optionRows.length) {
      alert("옵션은 최소 1개 이상 입력해야 합니다.");
      return;
    }

    const products = getProducts();
    products.push({
      id: uid("product"),
      name,
      category,
      price,
      originalPrice,
      image,
      badge,
      description,
      createdAt: Date.now(),
      options: optionRows.map((opt) => ({
        id: uid("opt"),
        name: opt.name,
        stock: sanitizeNumber(opt.stock, 0)
      }))
    });

    setProducts(products);

    // [방어 로직]: 새 상품 추가 후 마지막 페이지로 이동
    state.productPage = getTotalPages(products.length, PAGE_SIZE.products);

    form.reset();
    el.addOptionList.innerHTML = "";
    ensureOptionEditorMinimum(el.addOptionList);
    alert("상품이 추가되었습니다.");
    renderAdminProducts();
  }

  function loadProductToEdit(productId) {
    const product = getProducts().find((item) => item.id === productId);
    if (!product) {
      alert("수정할 상품을 찾을 수 없습니다.");
      return;
    }

    el.editProductId.value = product.id;
    el.editName.value = product.name || "";
    el.editCategory.value = product.category || "";
    el.editPrice.value = sanitizeNumber(product.price, 0);
    el.editOriginalPrice.value = sanitizeNumber(product.originalPrice, 0);
    el.editImage.value = product.image || "";
    el.editBadge.value = product.badge || "";
    el.editDesc.value = product.description || "";

    el.editOptionList.innerHTML = "";
    (product.options || []).forEach((opt) => {
      el.editOptionList.insertAdjacentHTML("beforeend", createOptionEditorRow(opt.name, opt.stock));
    });
    ensureOptionEditorMinimum(el.editOptionList);

    openEditModal();
  }

  function cleanupInvalidCartItems() {
    const carts = getCartsMap();
    const products = getProducts();

    Object.keys(carts).forEach((userId) => {
      const cart = Array.isArray(carts[userId]) ? carts[userId] : [];
      const cleaned = cart.filter((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return false;
        const option = (product.options || []).find((opt) => opt.id === item.optionId);
        if (!option) return false;
        return true;
      });

      carts[userId] = cleaned;
    });

    setCartsMap(carts);
  }

  function updateProduct(form) {
    const productId = el.editProductId.value;
    const products = getProducts();
    const index = products.findIndex((item) => item.id === productId);

    if (index === -1) {
      alert("수정 대상 상품을 찾을 수 없습니다.");
      return;
    }

    const name = el.editName.value.trim();
    const category = el.editCategory.value.trim();
    const price = sanitizeNumber(el.editPrice.value, 0);
    const originalPrice = sanitizeNumber(el.editOriginalPrice.value, 0);
    const image = el.editImage.value.trim() || DEFAULT_IMAGE;
    const badge = el.editBadge.value.trim();
    const description = el.editDesc.value.trim();
    const optionRows = getOptionRowsData(el.editOptionList);

    // [방어 로직]: 수정 시에도 옵션 1개 이상 유지 강제
    if (!name || !category) {
      alert("상품명과 카테고리를 입력해 주세요.");
      return;
    }

    if (!optionRows.length) {
      alert("옵션은 최소 1개 이상 존재해야 합니다.");
      return;
    }

    const existingProduct = products[index];
    const existingOptions = Array.isArray(existingProduct.options) ? existingProduct.options : [];

    const nextOptions = optionRows.map((row) => {
      const matched = existingOptions.find((opt) => opt.name === row.name);
      return {
        id: matched ? matched.id : uid("opt"),
        name: row.name,
        stock: sanitizeNumber(row.stock, 0)
      };
    });

    products[index] = {
      ...existingProduct,
      name,
      category,
      price,
      originalPrice,
      image,
      badge,
      description,
      options: nextOptions
    };

    setProducts(products);
    cleanupInvalidCartItems();

    alert("상품 정보가 수정되었습니다.");
    closeEditModal();
    renderAdminProducts();
  }

  function logout() {
    setCurrentUserId("");
    alert("로그아웃되었습니다.");
    location.href = INDEX_PAGE_URL;
  }

  function handlePaginationClick(event) {
    const button = event.target.closest("[data-page-type][data-page]");
    if (!button) return;

    const type = button.dataset.pageType;
    const targetPage = sanitizeNumber(button.dataset.page, 1);

    if (type === "orders") {
      state.orderPage = targetPage;
      renderAdminOrders();
      return;
    }

    if (type === "products") {
      state.productPage = targetPage;
      renderAdminProducts();
    }
  }

  function bindEvents() {
    el.goStoreBtn?.addEventListener("click", () => {
      location.href = INDEX_PAGE_URL;
    });

    el.goIndexBtn?.addEventListener("click", () => {
      location.href = INDEX_PAGE_URL;
    });

    el.adminLogoutBtn?.addEventListener("click", () => {
      logout();
    });

    el.orderPagination?.addEventListener("click", handlePaginationClick);
    el.productPagination?.addEventListener("click", handlePaginationClick);

    el.addOptionRowBtn?.addEventListener("click", () => {
      el.addOptionList.insertAdjacentHTML("beforeend", createOptionEditorRow("", 0));
    });

    el.editOptionRowBtn?.addEventListener("click", () => {
      el.editOptionList.insertAdjacentHTML("beforeend", createOptionEditorRow("", 0));
    });

    el.addOptionList?.addEventListener("click", (event) => {
      if (!event.target.classList.contains("remove-option-row-btn")) return;
      event.target.closest(".option-editor-row")?.remove();
      ensureOptionEditorMinimum(el.addOptionList);
    });

    el.editOptionList?.addEventListener("click", (event) => {
      if (!event.target.classList.contains("remove-option-row-btn")) return;
      event.target.closest(".option-editor-row")?.remove();
      ensureOptionEditorMinimum(el.editOptionList);
    });

    el.addProductForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      addProduct(event.target);
    });

    el.adminProductList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-edit-product-id]");
      if (!button) return;
      loadProductToEdit(button.dataset.editProductId);
    });

    el.editProductForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      updateProduct(event.target);
    });

    el.cancelEditBtn?.addEventListener("click", () => {
      closeEditModal();
    });

    el.closeEditModalBtn?.addEventListener("click", () => {
      closeEditModal();
    });

    el.editProductModal?.addEventListener("click", (event) => {
      if (event.target.dataset.close === "edit-product") {
        closeEditModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeEditModal();
      }
    });
  }

  function init() {
    if (!ensureAdminAccess()) return;
    renderAdminInfo();
    ensureOptionEditorMinimum(el.addOptionList);
    ensureOptionEditorMinimum(el.editOptionList);
    bindEvents();
    renderAdminOrders();
    renderAdminProducts();
  }

  init();
})();