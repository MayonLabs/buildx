(function () {
  // Get the script element and extract bot ID
  const script = document.currentScript || document.querySelector('script[data-bot-id]');
  if (!script) {
    console.error('Bot CMS: Could not find script element');
    return;
  }

  const botId = script.getAttribute('data-bot-id');
  if (!botId) {
    console.error('Bot CMS: Missing data-bot-id attribute');
    return;
  }

  // Base URL
  const scriptSrc = script.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  // Fetch Bot Configuration
  fetch(`${baseUrl}/api/bots/public/${botId}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load bot config');
      return response.json();
    })
    .then(data => {
      initWidget(data.config);
    })
    .catch(err => {
      console.error('Bot CMS: Error initializing widget', err);
      // Fallback or exit
    });

  function initWidget(botConfig) {
    const theme = botConfig.theme || {};
    const position = botConfig.widgetPosition || 'bottom-right';

    // Theme tokens — read from theme with sensible defaults so existing bots keep working.
    const launcherColor = theme.launcher?.bgColor || theme.primaryColor || '#8b5cf6';
    const launcherIconColor = theme.launcher?.iconColor || '#ffffff';
    const launcherSize = theme.launcher?.size || '60px';
    const launcherIconSize = theme.launcher?.iconSize || '28px';
    const launcherOffsetX = theme.launcher?.offsetX || '20px';
    const launcherOffsetY = theme.launcher?.offsetY || '20px';
    const launcherShadow = theme.launcher?.shadow || '0 4px 12px rgba(0,0,0,0.15)';
    const launcherShadowHover = theme.launcher?.shadowHover || '0 8px 24px rgba(0,0,0,0.2)';
    const launcherCloseBg = theme.launcher?.closeBgColor || launcherColor;
    const launcherCloseIconColor = theme.launcher?.closeIconColor || launcherIconColor;
    const launcherBorderColor = theme.launcher?.borderColor || 'transparent';
    const launcherBorderWidth = theme.launcher?.borderWidth || '0';
    // Widget size — drives the iframe container.
    const widgetWidth = theme.chatWindow?.width || '380px';
    const widgetHeight = theme.chatWindow?.height || '600px';
    const iframeOffsetY = `calc(${launcherSize} + ${launcherOffsetY} + 10px)`;

    const styles = document.createElement('style');
    styles.textContent = `
      .buildx-launcher {
        position: fixed;
        ${position.includes('bottom') ? `bottom: ${launcherOffsetY};` : `top: ${launcherOffsetY};`}
        ${position.includes('right') ? `right: ${launcherOffsetX};` : `left: ${launcherOffsetX};`}
        width: ${launcherSize};
        height: ${launcherSize};
        border-radius: ${theme.launcher?.borderRadius || '50%'};
        background: ${launcherColor};
        border: ${launcherBorderWidth} solid ${launcherBorderColor};
        cursor: pointer;
        box-shadow: ${launcherShadow};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
        z-index: 2147483647;
        font-family: ${theme.common?.fontFamily || 'inherit'};
      }
      .buildx-launcher:hover {
        transform: scale(1.05);
        box-shadow: ${launcherShadowHover};
      }
      .buildx-launcher svg {
        width: ${launcherIconSize};
        height: ${launcherIconSize};
        color: ${launcherIconColor};
        stroke: ${launcherIconColor};
      }
      .buildx-iframe-container {
        position: fixed;
        ${position.includes('bottom') ? `bottom: ${iframeOffsetY};` : `top: ${iframeOffsetY};`}
        ${position.includes('right') ? `right: ${launcherOffsetX};` : `left: ${launcherOffsetX};`}
        width: ${widgetWidth};
        height: ${widgetHeight};
        max-height: calc(100vh - ${iframeOffsetY} - 20px);
        border-radius: ${theme.common?.borderRadius || '16px'};
        overflow: hidden;
        box-shadow: ${theme.common?.shadow || '0 12px 40px rgba(0,0,0,0.12)'};
        z-index: 2147483646;
        display: none;
        background: transparent;
        font-family: ${theme.common?.fontFamily || 'inherit'};
      }
      .buildx-launcher.is-open {
        background: ${launcherCloseBg};
      }
      .buildx-launcher.is-open svg {
        color: ${launcherCloseIconColor};
        stroke: ${launcherCloseIconColor};
      }
      .buildx-iframe-container.open {
        display: block;
        animation: botcms-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .buildx-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
      }
      @keyframes botcms-slideIn {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 480px) {
        .buildx-iframe-container {
          width: calc(100vw - 40px);
          height: calc(100vh - ${iframeOffsetY} - 20px);
          ${position.includes('right') ? `right: ${launcherOffsetX};` : `left: ${launcherOffsetX};`}
        }
      }
    `;
    document.head.appendChild(styles);

    // Create launcher button
    const launcher = document.createElement('button');
    launcher.className = 'buildx-launcher';
    launcher.setAttribute('aria-label', 'Chat with us');

    // Default Icon (Bot)
    const chatIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
    `;

    // Close Icon (X)
    const closeIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
    `;

    launcher.innerHTML = theme.launcher?.icon || chatIcon;
    document.body.appendChild(launcher);

    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.className = 'buildx-iframe-container';

    // Determine iframe src (pass minimal rendering hints via query params if needed, 
    // but the page itself should fetch config or we pass config via postMessage)
    // For now, simpler to let the page fetch config too or rely on session? 
    // Public page should fetch public config.
    const iframe = document.createElement('iframe');
    iframe.className = 'buildx-iframe';
    iframe.src = `${baseUrl}/share/${botId}?embed=true`;
    iframe.title = 'Chat Widget';

    iframeContainer.appendChild(iframe);
    document.body.appendChild(iframeContainer);

    // Toggle logic
    let isOpen = false;
    launcher.addEventListener('click', function () {
      isOpen = !isOpen;
      iframeContainer.classList.toggle('open', isOpen);
      launcher.classList.toggle('is-open', isOpen);

      if (isOpen) {
        launcher.innerHTML = theme.launcher?.closeIcon || closeIcon;
      } else {
        launcher.innerHTML = theme.launcher?.icon || chatIcon;
      }
    });

    // Listen for close messages from iframe
    window.addEventListener('message', function (event) {
      if (event.data === 'buildx-close-widget') {
        isOpen = false;
        iframeContainer.classList.remove('open');
        launcher.classList.remove('is-open');
        launcher.innerHTML = theme.launcher?.icon || chatIcon;
      }
    });
  }
})();
