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

  // Configuration
  const config = {
    position: script.getAttribute('data-position') || 'bottom-right',
    primaryColor: script.getAttribute('data-color') || '#8b5cf6',
  };

  // Get the base URL from the script src
  const scriptSrc = script.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

  // Create styles
  const styles = document.createElement('style');
  styles.textContent = `
    .botx-launcher {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${config.primaryColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 9999;
    }
    .botx-launcher:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(0,0,0,0.4);
    }
    .botx-launcher svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .botx-iframe-container {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: 380px;
      height: 550px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 9998;
      display: none;
      background: #18181b;
    }
    .botx-iframe-container.open {
      display: block;
      animation: botcms-slideIn 0.3s ease-out;
    }
    .botx-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @keyframes botcms-slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (max-width: 480px) {
      .botcms-iframe-container {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
        ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      }
    }
  `;
  document.head.appendChild(styles);

  // Create launcher button
  const launcher = document.createElement('button');
  launcher.className = 'botx-launcher';
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      <circle cx="8" cy="10" r="1.5"/>
      <circle cx="12" cy="10" r="1.5"/>
      <circle cx="16" cy="10" r="1.5"/>
    </svg>
  `;
  document.body.appendChild(launcher);

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.className = 'botx-iframe-container';

  const iframe = document.createElement('iframe');
  iframe.className = 'botx-iframe';
  iframe.src = `${baseUrl}/share/${botId}`;
  iframe.title = 'Chat';

  iframeContainer.appendChild(iframe);
  document.body.appendChild(iframeContainer);

  // Toggle chat
  let isOpen = false;
  launcher.addEventListener('click', function () {
    isOpen = !isOpen;
    iframeContainer.classList.toggle('open', isOpen);

    // Update icon
    if (isOpen) {
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
    } else {
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
      `;
    }
  });
})();
