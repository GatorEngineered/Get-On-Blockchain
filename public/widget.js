/**
 * GetOnBlockchain Loyalty Widget
 * Embeddable widget for displaying member points on external websites
 *
 * Usage:
 * <script src="https://getonblockchain.com/widget.js" data-merchant="your-merchant-slug"></script>
 *
 * Or with options:
 * <script>
 *   window.GOBWidgetConfig = {
 *     merchant: 'your-merchant-slug',
 *     position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
 *     theme: 'light', // light, dark, auto
 *     primaryColor: '#244b7a',
 *     collapsed: true, // Start collapsed
 *   };
 * </script>
 * <script src="https://getonblockchain.com/widget.js"></script>
 */

(function() {
  'use strict';

  // Prevent double-loading
  if (window.GOBWidget) return;

  const API_BASE = 'https://getonblockchain.com';

  // Get configuration
  const scriptTag = document.currentScript;
  const config = window.GOBWidgetConfig || {};

  const merchantSlug = config.merchant || (scriptTag && scriptTag.getAttribute('data-merchant'));
  const position = config.position || 'bottom-right';
  const theme = config.theme || 'light';
  const primaryColor = config.primaryColor || '#244b7a';
  const startCollapsed = config.collapsed !== false;

  if (!merchantSlug) {
    console.error('[GOB Widget] Missing merchant slug. Add data-merchant="your-slug" to the script tag.');
    return;
  }

  // State
  let memberEmail = null;
  let memberData = null;
  let isExpanded = !startCollapsed;
  let merchantInfo = null;

  // Create styles
  const styles = `
    #gob-widget-container {
      position: fixed;
      ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
    }

    #gob-widget-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    #gob-widget-toggle:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    #gob-widget-toggle svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    #gob-widget-panel {
      position: absolute;
      ${position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
      ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 320px;
      background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      overflow: hidden;
      display: none;
      color: ${theme === 'dark' ? '#f3f4f6' : '#1f2937'};
    }

    #gob-widget-panel.expanded {
      display: block;
      animation: gob-slide-in 0.3s ease;
    }

    @keyframes gob-slide-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .gob-header {
      background: ${primaryColor};
      color: white;
      padding: 16px;
      text-align: center;
    }

    .gob-header h3 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .gob-header p {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .gob-content {
      padding: 20px;
    }

    .gob-points-display {
      text-align: center;
      padding: 16px;
      background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .gob-points-number {
      font-size: 36px;
      font-weight: 700;
      color: ${primaryColor};
    }

    .gob-points-label {
      font-size: 12px;
      color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gob-tier-badge {
      display: inline-block;
      padding: 4px 12px;
      background: ${primaryColor};
      color: white;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 8px;
    }

    .gob-login-form {
      text-align: center;
    }

    .gob-login-form p {
      margin: 0 0 16px 0;
      color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
    }

    .gob-input {
      width: 100%;
      padding: 12px;
      border: 1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'};
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 12px;
      background: ${theme === 'dark' ? '#374151' : '#ffffff'};
      color: ${theme === 'dark' ? '#f3f4f6' : '#1f2937'};
      box-sizing: border-box;
    }

    .gob-input:focus {
      outline: none;
      border-color: ${primaryColor};
    }

    .gob-btn {
      width: 100%;
      padding: 12px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .gob-btn:hover {
      opacity: 0.9;
    }

    .gob-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .gob-link {
      display: block;
      text-align: center;
      margin-top: 12px;
      color: ${primaryColor};
      text-decoration: none;
      font-size: 13px;
    }

    .gob-link:hover {
      text-decoration: underline;
    }

    .gob-footer {
      padding: 12px 16px;
      border-top: 1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'};
      text-align: center;
      font-size: 11px;
      color: ${theme === 'dark' ? '#6b7280' : '#9ca3af'};
    }

    .gob-footer a {
      color: inherit;
      text-decoration: none;
    }

    .gob-error {
      color: #ef4444;
      font-size: 13px;
      margin-top: 8px;
    }

    .gob-loading {
      text-align: center;
      padding: 20px;
      color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const container = document.createElement('div');
  container.id = 'gob-widget-container';
  container.innerHTML = `
    <button id="gob-widget-toggle" aria-label="Loyalty Rewards">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </button>
    <div id="gob-widget-panel">
      <div class="gob-header">
        <h3>Loyalty Rewards</h3>
        <p id="gob-merchant-name">Loading...</p>
      </div>
      <div class="gob-content" id="gob-content">
        <div class="gob-loading">Loading...</div>
      </div>
      <div class="gob-footer">
        Powered by <a href="https://getonblockchain.com" target="_blank">GetOnBlockchain</a>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Get elements
  const toggleBtn = document.getElementById('gob-widget-toggle');
  const panel = document.getElementById('gob-widget-panel');
  const content = document.getElementById('gob-content');
  const merchantNameEl = document.getElementById('gob-merchant-name');

  // Toggle panel
  toggleBtn.addEventListener('click', function() {
    isExpanded = !isExpanded;
    panel.classList.toggle('expanded', isExpanded);
    if (isExpanded && !memberEmail) {
      loadMerchantInfo();
    }
  });

  // Load merchant info
  async function loadMerchantInfo() {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${merchantSlug}/info`);
      if (res.ok) {
        merchantInfo = await res.json();
        merchantNameEl.textContent = merchantInfo.name;
      }
    } catch (e) {
      console.error('[GOB Widget] Error loading merchant info:', e);
    }
    renderContent();
  }

  // Check for stored email
  function getStoredEmail() {
    try {
      return localStorage.getItem('gob_member_email');
    } catch (e) {
      return null;
    }
  }

  function storeEmail(email) {
    try {
      localStorage.setItem('gob_member_email', email);
    } catch (e) {}
  }

  // Load member data
  async function loadMemberData(email) {
    try {
      content.innerHTML = '<div class="gob-loading">Loading your points...</div>';
      const res = await fetch(`${API_BASE}/api/widget/${merchantSlug}/member?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        memberData = await res.json();
        memberEmail = email;
        storeEmail(email);
      } else {
        memberData = null;
      }
    } catch (e) {
      console.error('[GOB Widget] Error loading member data:', e);
      memberData = null;
    }
    renderContent();
  }

  // Render content based on state
  function renderContent() {
    const storedEmail = getStoredEmail();

    if (storedEmail && !memberEmail) {
      loadMemberData(storedEmail);
      return;
    }

    if (memberData && memberData.enrolled) {
      // Show points
      content.innerHTML = `
        <div class="gob-points-display">
          <div class="gob-points-number">${memberData.points.toLocaleString()}</div>
          <div class="gob-points-label">Points</div>
          <div class="gob-tier-badge">${memberData.tier}</div>
        </div>
        <a href="${API_BASE}/m/${merchantSlug}" target="_blank" class="gob-btn">
          View Rewards
        </a>
        <a href="#" class="gob-link" id="gob-logout">Not you? Sign out</a>
      `;
      document.getElementById('gob-logout').addEventListener('click', function(e) {
        e.preventDefault();
        memberEmail = null;
        memberData = null;
        try {
          localStorage.removeItem('gob_member_email');
        } catch (e) {}
        renderContent();
      });
    } else {
      // Show login form
      content.innerHTML = `
        <div class="gob-login-form">
          <p>Enter your email to check your points balance</p>
          <input type="email" class="gob-input" id="gob-email-input" placeholder="your@email.com" />
          <button class="gob-btn" id="gob-check-btn">Check Points</button>
          <div class="gob-error" id="gob-error" style="display:none;"></div>
          <a href="${API_BASE}/m/${merchantSlug}" target="_blank" class="gob-link">
            Not a member? Join now
          </a>
        </div>
      `;

      const emailInput = document.getElementById('gob-email-input');
      const checkBtn = document.getElementById('gob-check-btn');
      const errorEl = document.getElementById('gob-error');

      checkBtn.addEventListener('click', async function() {
        const email = emailInput.value.trim();
        if (!email || !email.includes('@')) {
          errorEl.textContent = 'Please enter a valid email';
          errorEl.style.display = 'block';
          return;
        }
        errorEl.style.display = 'none';
        checkBtn.disabled = true;
        checkBtn.textContent = 'Checking...';
        await loadMemberData(email);
        if (!memberData || !memberData.enrolled) {
          errorEl.textContent = 'No account found. Join our loyalty program!';
          errorEl.style.display = 'block';
          checkBtn.disabled = false;
          checkBtn.textContent = 'Check Points';
        }
      });

      emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          checkBtn.click();
        }
      });
    }
  }

  // Initialize
  if (isExpanded) {
    panel.classList.add('expanded');
    loadMerchantInfo();
  }

  const storedEmail = getStoredEmail();
  if (storedEmail) {
    loadMemberData(storedEmail);
  }

  // Expose API
  window.GOBWidget = {
    open: function() {
      isExpanded = true;
      panel.classList.add('expanded');
    },
    close: function() {
      isExpanded = false;
      panel.classList.remove('expanded');
    },
    toggle: function() {
      toggleBtn.click();
    },
    setEmail: function(email) {
      loadMemberData(email);
    },
    getPoints: function() {
      return memberData ? memberData.points : null;
    }
  };

})();
