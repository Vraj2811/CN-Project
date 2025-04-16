document.addEventListener('DOMContentLoaded', function() {
    // Form validation
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const domainInput = document.getElementById('domain');
            if (domainInput && !domainInput.value.trim()) {
                e.preventDefault();
                alert('Please enter a domain name');
            }
        });
    }

    // Add animation to timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length > 0) {
        timelineItems.forEach((item, index) => {
            const delay = parseInt(item.dataset.delay || index * 300);
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transition = 'opacity 0.5s ease-in-out';
                setTimeout(() => {
                    item.style.opacity = '1';
                }, 100);
            }, delay);
        });
    }

    // TTL countdown for cached results
    const ttlCounters = document.querySelectorAll('.ttl-counter');
    if (ttlCounters.length > 0) {
        ttlCounters.forEach(counter => {
            const ttl = parseInt(counter.dataset.ttl);
            let remaining = ttl;

            const interval = setInterval(() => {
                remaining--;
                counter.textContent = remaining;

                if (remaining <= 0) {
                    clearInterval(interval);
                    counter.parentElement.innerHTML = '<span class="expired">Expired</span>';
                }
            }, 1000);
        });
    }

    // Cache result button
    const cacheButton = document.getElementById('cache-result');
    if (cacheButton) {
        cacheButton.addEventListener('click', function() {
            const domain = this.dataset.domain;
            const recordType = this.dataset.recordType;

            if (domain && recordType) {
                window.location.href = `/resolve?domain=${domain}&record_type=${recordType}&use_cache=true`;
            }
        });
    }

    // Terminal actions
    const copyTerminalBtn = document.getElementById('copy-terminal');
    if (copyTerminalBtn) {
        copyTerminalBtn.addEventListener('click', function() {
            const terminalOutput = document.getElementById('terminal-output');
            const terminalPrompt = document.querySelector('.terminal-prompt');
            if (terminalOutput && terminalPrompt) {
                const command = terminalPrompt.textContent.trim();
                const output = terminalOutput.innerText;
                const textToCopy = `${command}\n${output}`;

                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        // Change button text temporarily
                        const originalText = this.textContent;
                        this.textContent = 'Copied!';
                        setTimeout(() => {
                            this.textContent = originalText;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
            }
        });
    }

    const expandTerminalBtn = document.getElementById('expand-terminal');
    if (expandTerminalBtn) {
        expandTerminalBtn.addEventListener('click', function() {
            const terminalDisplay = document.querySelector('.terminal-display');
            if (terminalDisplay) {
                terminalDisplay.classList.toggle('terminal-expanded');
                this.textContent = terminalDisplay.classList.contains('terminal-expanded') ? 'Collapse Terminal' : 'Expand Terminal';
            }
        });
    }

    // Update terminal output with real command output
    const updateTerminalOutput = () => {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;

        const domain = document.querySelector('.domain-info strong:nth-of-type(1) + span')?.textContent;
        const recordType = document.querySelector('.domain-info strong:nth-of-type(2) + span')?.textContent;
        const queryMode = document.querySelector('.domain-info strong:nth-of-type(3) + span')?.textContent?.toLowerCase();

        if (!domain || !recordType) return;

        // Show loading message
        terminalOutput.innerHTML = 'Executing DNS query...\nPlease wait, this may take a few seconds...';

        // Fetch the actual command output
        fetch('/api/nslookup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: domain,
                record_type: recordType,
                query_mode: queryMode
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Format the output for better readability with syntax highlighting
                let formattedOutput = data.stdout
                    // Replace newlines with <br>
                    .replace(/\n/g, '<br>')
                    // Highlight comments
                    .replace(/(;.*?)(<br>|$)/g, '<span class="comment">$1</span>$2')
                    // Highlight record types
                    .replace(/(\bIN\s+)(A|AAAA|CNAME|MX|NS|TXT|SOA|PTR|SRV)\b/g, '$1<span class="record-type">$2</span>')
                    // Highlight IP addresses
                    .replace(/(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)/g, '<span class="ip-address">$1</span>')
                    .replace(/([0-9a-f:]+::[0-9a-f:]+)/g, '<span class="ip-address">$1</span>')
                    // Highlight domain names
                    .replace(/([a-z0-9][-a-z0-9]*\.)+[a-z0-9][-a-z0-9]*/gi, function(match) {
                        // Don't highlight if already in a span
                        if (match.includes('<span')) return match;
                        return '<span class="domain">' + match + '</span>';
                    })
                    // Highlight section headers
                    .replace(/(ANSWER SECTION|QUESTION SECTION|AUTHORITY SECTION|ADDITIONAL SECTION)/g,
                             '<span class="section">$1</span>')
                    // Highlight query times
                    .replace(/(Query time: \d+ msec)/g, '<span class="time">$1</span>')
                    // Highlight EXPLANATION sections
                    .replace(/(EXPLANATION.*?)(<br>)/g, '<span class="section">$1</span>$2')
                    // Highlight command lines
                    .replace(/(Command: .*?)(<br>)/g, '<span class="command">$1</span>$2')
                    // Highlight numbers
                    .replace(/(\b\d+\b)(?!<\/span>)/g, '<span class="number">$1</span>')
                    // Highlight RECURSIVE and ITERATIVE
                    .replace(/(RECURSIVE|ITERATIVE)/g, '<span class="mode">$1</span>');

                terminalOutput.innerHTML = formattedOutput;

                // Scroll to the bottom of the terminal
                const terminalContent = document.querySelector('.terminal-content');
                if (terminalContent) {
                    terminalContent.scrollTop = terminalContent.scrollHeight;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching command output:', error);
            terminalOutput.innerHTML = `Error executing command: ${error.message}`;
        });
    };

    // Update terminal output if we're on the results page
    if (document.getElementById('terminal-output')) {
        updateTerminalOutput();
    }
});

