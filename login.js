(() => {
  const STORAGE_KEYS = {
    USERS: "vibe_store_users",
    CURRENT_USER_ID: "vibe_store_current_user_id"
  };

  const INITIAL_BALANCE = 1000000;
  const INDEX_PAGE_URL = "./index.html";

  const $ = (selector) => document.querySelector(selector);

  const el = {
    showLoginBtn: $("#showLoginBtn"),
    showSignupBtn: $("#showSignupBtn"),
    loginForm: $("#loginForm"),
    signupForm: $("#signupForm"),
    goHomeBtn: $("#goHomeBtn"),
    loginId: $("#loginId"),
    loginPw: $("#loginPw"),
    signupId: $("#signupId"),
    signupPw: $("#signupPw"),
    signupNickname: $("#signupNickname")
  };

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
    // [방어 로직]: 공백/대소문자 차이로 인한 중복 및 비교 오류 방지
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function getUsers() {
    const users = load(STORAGE_KEYS.USERS, []);
    return Array.isArray(users) ? users : [];
  }

  function setUsers(users) {
    save(STORAGE_KEYS.USERS, users);
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

  function ensureAdminAccount() {
    const users = getUsers();
    const hasAdmin = users.some((user) => user.id === "admin");

    if (!hasAdmin) {
      // [방어 로직]: 관리자 계정이 없으면 시스템 기본 계정 강제 생성
      users.push({
        id: "admin",
        password: "admin",
        nickname: "관리자",
        role: "admin",
        balance: 999999999,
        createdAt: Date.now()
      });
      setUsers(users);
    }
  }

  function switchTab(tab) {
    const isLogin = tab === "login";

    el.loginForm.classList.toggle("hidden", !isLogin);
    el.signupForm.classList.toggle("hidden", isLogin);
    el.showLoginBtn.classList.toggle("active", isLogin);
    el.showSignupBtn.classList.toggle("active", !isLogin);

    if (isLogin) {
      el.loginId?.focus();
    } else {
      el.signupId?.focus();
    }
  }

  function goToIndex() {
    location.href = INDEX_PAGE_URL;
  }

  function login(id, pw) {
    const users = getUsers();
    const normalizedId = normalizeText(id);
    const safePw = String(pw ?? "").trim();

    // [방어 로직]: 빈 값 로그인 차단
    if (!normalizedId || !safePw) {
      alert("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    const user = users.find(
      (item) => normalizeText(item.id) === normalizedId && String(item.password) === safePw
    );

    // [방어 로직]: 잘못된 인증 정보 차단
    if (!user) {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    setCurrentUserId(user.id);
    alert(`${user.nickname}님, 로그인되었습니다.`);
    goToIndex();
  }

  function signup(id, pw, nickname) {
    const users = getUsers();

    const normalizedId = normalizeText(id);
    const safePw = String(pw ?? "").trim();
    const safeNickname = String(nickname ?? "").trim();

    // [방어 로직]: 필수 입력 누락 방지
    if (!normalizedId || !safePw || !safeNickname) {
      alert("아이디, 비밀번호, 닉네임을 모두 입력해 주세요.");
      return;
    }

    // [방어 로직]: 관리자 아이디 사용 방지
    if (normalizedId === "admin") {
      alert("해당 아이디는 사용할 수 없습니다.");
      return;
    }

    // [방어 로직]: 중복 아이디 가입 차단
    const isDuplicate = users.some((user) => normalizeText(user.id) === normalizedId);
    if (isDuplicate) {
      alert("이미 존재하는 아이디입니다.");
      return;
    }

    users.push({
      id: normalizedId,
      password: safePw,
      nickname: safeNickname,
      role: "user",
      balance: INITIAL_BALANCE,
      createdAt: Date.now()
    });

    setUsers(users);
    setCurrentUserId(normalizedId);

    alert("회원가입이 완료되었습니다. 로그인 상태로 메인 페이지로 이동합니다.");
    goToIndex();
  }

  function bindEvents() {
    el.showLoginBtn?.addEventListener("click", () => {
      switchTab("login");
    });

    el.showSignupBtn?.addEventListener("click", () => {
      switchTab("signup");
    });

    el.loginForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      login(el.loginId?.value, el.loginPw?.value);
    });

    el.signupForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      signup(
        el.signupId?.value,
        el.signupPw?.value,
        el.signupNickname?.value
      );
    });

    el.goHomeBtn?.addEventListener("click", () => {
      goToIndex();
    });
  }

  function restoreSessionUI() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    const user = getUsers().find((item) => item.id === currentUserId);
    if (!user) {
      // [방어 로직]: 존재하지 않는 유저 세션은 제거
      setCurrentUserId("");
      return;
    }

    // 이미 로그인된 상태로 login.html에 왔을 때도 폼은 유지하되 안내만 보여줌
    const notice = document.createElement("div");
    notice.className = "order-item";
    notice.innerHTML = `
      <p><strong>${user.nickname}</strong>님은 현재 로그인된 상태입니다.</p>
      <p class="muted">다시 로그인하거나 홈으로 돌아갈 수 있습니다.</p>
    `;

    const panel = document.querySelector(".login-panel");
    if (panel) {
      const actions = document.querySelector(".login-page-actions");
      if (actions) {
        panel.insertBefore(notice, actions);
      } else {
        panel.appendChild(notice);
      }
    }
  }

  function init() {
    ensureAdminAccount();
    bindEvents();
    switchTab("login");
    restoreSessionUI();
  }

  init();
})();