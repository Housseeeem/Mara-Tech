/**
 * Banking Module
 * Handles all banking-related functionality including transactions, balance management,
 * and voice-controlled banking operations.
 */

// ===== BANKING CONSTANTS =====
const BANKING_API_URL = 'http://localhost:8000/api/banking/transaction/';
const BALANCE_API_URL = 'http://localhost:8000/api/banking/balance/';
const HISTORY_API_URL = 'http://localhost:8000/api/banking/history/';

// ===== BANKING STATE =====
let accountBalance = 5240.50;
const transactions = [
    { id: 1, description: 'Salary Deposit', date: 'Feb 1, 2026', amount: 3500.00, type: 'credit' },
    { id: 2, description: 'Online Shopping', date: 'Feb 6, 2026', amount: -125.00, type: 'debit' },
    { id: 3, description: 'Mobile Payment', date: 'Jan 28, 2026', amount: -45.99, type: 'debit' }
];

let voiceTransactionData = {
    recipient: null,
    amount: null,
    description: null,
    step: 0
};

// ===== BANKING UI FUNCTIONS =====

/**
 * Show the main banking view with account overview and quick actions
 */
function showMainBanking() {
    document.getElementById('bankingMainView').style.display = 'grid';
    document.getElementById('transactionForm').style.display = 'none';
    document.getElementById('transactionsList').style.display = 'none';
    document.getElementById('balanceDisplay').style.display = 'none';
}

/**
 * Show the transaction form interface
 */
function showTransactionForm() {
    document.getElementById('bankingMainView').style.display = 'none';
    document.getElementById('transactionForm').style.display = 'block';
    document.getElementById('transactionsList').style.display = 'none';
    document.getElementById('balanceDisplay').style.display = 'none';

    // Reset the interface
    document.getElementById('voiceConversation').innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🎙️</div>
            <p class="text-lg text-gray-600 dark:text-white/80">Say "Start" to begin the transaction</p>
        </div>
    `;
    document.getElementById('transactionSummary').style.display = 'none';
    document.getElementById('startVoiceTransactionBtn').style.display = 'none'; // Hide the button
    document.getElementById('confirmTransactionBtn').style.display = 'none';

    // Announce with voice and then listen for "start"
    const utterance = new SpeechSynthesisUtterance('Voice transaction mode activated. Say start to begin the transaction.');
    utterance.lang = 'en-US';
    utterance.onend = () => {
        setTimeout(() => {
            listenForStartCommand();
        }, 500);
    };
    speechSynthesis.speak(utterance);
}

/**
 * Listen for "start" command to begin transaction
 */
function listenForStartCommand() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addConversationMessage('system', 'Speech recognition not supported. Please click the start button.');
        document.getElementById('startVoiceTransactionBtn').style.display = 'flex';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Update UI to show listening
    document.getElementById('voiceConversation').innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4 listening-indicator">🎤</div>
            <p class="text-lg text-gray-600 dark:text-white/80">Listening... Say "Start" or "Commencer"</p>
        </div>
    `;

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();

        // Check for start keywords in multiple languages
        const startKeywords = ['start', 'commencer', 'démarrer', 'demarrer', 'débuter', 'debuter', 'go', 'begin', 'oui', 'yes'];
        const isStart = startKeywords.some(keyword => transcript.includes(keyword));

        if (isStart) {
            startVoiceTransaction();
        } else {
            // Retry
            document.getElementById('voiceConversation').innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🎙️</div>
                    <p class="text-lg text-gray-600 dark:text-white/80">I heard "${transcript}". Say "Start" to begin.</p>
                </div>
            `;

            const retryUtterance = new SpeechSynthesisUtterance('Please say start to begin the transaction.');
            retryUtterance.lang = 'en-US';
            retryUtterance.onend = () => {
                setTimeout(() => {
                    listenForStartCommand();
                }, 500);
            };
            speechSynthesis.speak(retryUtterance);
        }
    };

    recognition.onerror = (event) => {
        console.error('Start command recognition error:', event.error);
        if (event.error === 'no-speech') {
            // Retry if no speech detected
            const retryUtterance = new SpeechSynthesisUtterance('I did not hear anything. Say start to begin.');
            retryUtterance.lang = 'en-US';
            retryUtterance.onend = () => {
                setTimeout(() => {
                    listenForStartCommand();
                }, 500);
            };
            speechSynthesis.speak(retryUtterance);
        } else {
            // Show button as fallback
            document.getElementById('startVoiceTransactionBtn').style.display = 'flex';
        }
    };
}

/**
 * Add a message to the voice conversation display
 * @param {string} speaker - 'system' or 'user'
 * @param {string} message - The message text
 * @param {boolean} isListening - Whether system is listening
 */
function addConversationMessage(speaker, message, isListening = false) {
    const container = document.getElementById('voiceConversation');
    const messageDiv = document.createElement('div');
    messageDiv.className = speaker === 'system'
        ? 'p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg'
        : 'p-4 bg-gray-100 dark:bg-white/10 rounded-lg';

    const icon = speaker === 'system' ? '🤖' : '👤';
    const label = speaker === 'system' ? 'System' : 'You';

    messageDiv.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="text-2xl">${icon}</span>
            <div class="flex-1">
                <p class="font-semibold text-sm text-gray-600 dark:text-white/70">${label}</p>
                <p class="dark:text-white">${message}</p>
                ${isListening ? '<p class="text-sm text-blue-600 dark:text-blue-400 mt-2 listening-indicator">🎤 Listening...</p>' : ''}
            </div>
        </div>
    `;

    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// ===== VOICE TRANSACTION FUNCTIONS =====

/**
 * Start the voice transaction process
 */
function startVoiceTransaction() {
    // Clear previous conversation
    document.getElementById('voiceConversation').innerHTML = '';
    document.getElementById('startVoiceTransactionBtn').style.display = 'none';

    // Reset transaction data
    voiceTransactionData = {
        recipient: null,
        amount: null,
        description: null,
        step: 0
    };

    // Start conversation
    askForRecipient();
}

/**
 * Ask for recipient name in voice transaction
 */
function askForRecipient() {
    voiceTransactionData.step = 1;
    const message = "Who would you like to send money to? Please say the recipient's name.";
    addConversationMessage('system', message);

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => {
        setTimeout(() => {
            listenForResponse();
        }, 500);
    };

    speechSynthesis.speak(utterance);
}

/**
 * Ask for transaction amount in voice transaction
 */
function askForAmount() {
    voiceTransactionData.step = 2;
    const message = `Great! How much would you like to send to ${voiceTransactionData.recipient}? Please say the amount in dollars.`;
    addConversationMessage('system', message);

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => {
        setTimeout(() => {
            listenForResponse();
        }, 500);
    };

    speechSynthesis.speak(utterance);
}

/**
 * Ask for transaction description in voice transaction
 */
function askForDescription() {
    voiceTransactionData.step = 3;
    const message = "What is this payment for? Please briefly describe the transaction.";
    addConversationMessage('system', message);

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onend = () => {
        setTimeout(() => {
            listenForResponse();
        }, 500);
    };

    speechSynthesis.speak(utterance);
}

/**
 * Listen for user's voice response during transaction
 */
function listenForResponse() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addConversationMessage('system', 'Speech recognition not supported. Please use a compatible browser.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Add listening indicator
    addConversationMessage('system', 'Listening...', true);

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();

        // Remove listening indicator
        const lastMessage = document.getElementById('voiceConversation').lastChild;
        if (lastMessage) lastMessage.remove();

        // Add user's response
        addConversationMessage('user', transcript);

        // Process based on current step
        processVoiceResponse(transcript);
    };

    recognition.onerror = (event) => {
        const lastMessage = document.getElementById('voiceConversation').lastChild;
        if (lastMessage) lastMessage.remove();

        addConversationMessage('system', `Error: ${event.error}. Please try again.`);

        // Retry current step
        setTimeout(() => {
            retryCurrentStep();
        }, 2000);
    };
}

/**
 * Process voice response based on current transaction step
 * @param {string} transcript - The recognized speech text
 */
function processVoiceResponse(transcript) {
    const step = voiceTransactionData.step;

    if (step === 1) {
        // Extract recipient name
        voiceTransactionData.recipient = transcript;
        askForAmount();
    } else if (step === 2) {
        // Extract amount from speech
        const amount = extractAmount(transcript);
        if (amount && amount > 0) {
            voiceTransactionData.amount = amount;
            askForDescription();
        } else {
            addConversationMessage('system', "I couldn't understand the amount. Please say the amount again, for example: '150 dollars' or 'fifty dollars'.");
            setTimeout(() => {
                askForAmount();
            }, 2000);
        }
    } else if (step === 3) {
        // Get description
        voiceTransactionData.description = transcript;
        showTransactionSummary();
    }
}

/**
 * Extract numerical amount from spoken text
 * @param {string} text - The spoken text
 * @returns {number|null} The extracted amount or null
 */
function extractAmount(text) {
    // Remove common words
    text = text.toLowerCase().replace(/dollars?|bucks?|usd|\$/g, '').trim();

    // Try to find a number
    const numberMatch = text.match(/(\d+(?:\.\d{1,2})?)/);
    if (numberMatch) {
        return parseFloat(numberMatch[1]);
    }

    // Word to number conversion for common amounts
    const wordNumbers = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
        'hundred': 100, 'thousand': 1000
    };

    for (const [word, num] of Object.entries(wordNumbers)) {
        if (text.includes(word)) {
            return num;
        }
    }

    return null;
}

/**
 * Show transaction summary before confirmation
 */
function showTransactionSummary() {
    voiceTransactionData.step = 4;

    // Update summary display
    document.getElementById('summaryRecipient').textContent = voiceTransactionData.recipient;
    document.getElementById('summaryAmount').textContent = `$${voiceTransactionData.amount.toFixed(2)}`;
    document.getElementById('summaryDescription').textContent = voiceTransactionData.description;
    document.getElementById('transactionSummary').style.display = 'block';
    document.getElementById('confirmTransactionBtn').style.display = 'none'; // Hide button, use voice

    const message = `Perfect! Let me confirm: You want to send $${voiceTransactionData.amount.toFixed(2)} to ${voiceTransactionData.recipient} for ${voiceTransactionData.description}. Say confirm to complete the transaction, or say cancel to abort.`;
    addConversationMessage('system', message);

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => {
        setTimeout(() => {
            listenForConfirmCommand();
        }, 500);
    };
    speechSynthesis.speak(utterance);
}

/**
 * Listen for "confirm" or "cancel" command to complete or abort transaction
 */
function listenForConfirmCommand() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        addConversationMessage('system', 'Speech recognition not supported. Please click the confirm button.');
        document.getElementById('confirmTransactionBtn').style.display = 'block';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Add listening indicator
    addConversationMessage('system', 'Listening for confirmation...', true);

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();

        // Remove listening indicator
        const lastMessage = document.getElementById('voiceConversation').lastChild;
        if (lastMessage) lastMessage.remove();

        // Add user's response
        addConversationMessage('user', transcript);

        // Check for confirm keywords
        const confirmKeywords = ['confirm', 'confirmer', 'yes', 'oui', 'validate', 'valider', 'ok', 'send', 'envoyer'];
        const cancelKeywords = ['cancel', 'annuler', 'no', 'non', 'stop', 'abort'];

        const isConfirm = confirmKeywords.some(keyword => transcript.includes(keyword));
        const isCancel = cancelKeywords.some(keyword => transcript.includes(keyword));

        if (isConfirm) {
            confirmVoiceTransaction();
        } else if (isCancel) {
            cancelVoiceTransaction();
        } else {
            // Retry
            const retryMessage = `I heard "${transcript}". Please say confirm to complete the transaction, or cancel to abort.`;
            addConversationMessage('system', retryMessage);

            const retryUtterance = new SpeechSynthesisUtterance(retryMessage);
            retryUtterance.lang = 'en-US';
            retryUtterance.onend = () => {
                setTimeout(() => {
                    listenForConfirmCommand();
                }, 500);
            };
            speechSynthesis.speak(retryUtterance);
        }
    };

    recognition.onerror = (event) => {
        console.error('Confirm command recognition error:', event.error);

        // Remove listening indicator
        const lastMessage = document.getElementById('voiceConversation').lastChild;
        if (lastMessage) lastMessage.remove();

        if (event.error === 'no-speech') {
            const retryUtterance = new SpeechSynthesisUtterance('I did not hear anything. Say confirm or cancel.');
            retryUtterance.lang = 'en-US';
            retryUtterance.onend = () => {
                setTimeout(() => {
                    listenForConfirmCommand();
                }, 500);
            };
            speechSynthesis.speak(retryUtterance);
        } else {
            // Show button as fallback
            document.getElementById('confirmTransactionBtn').style.display = 'block';
        }
    };
}

/**
 * Confirm and send the voice transaction
 */
function confirmVoiceTransaction() {
    const { recipient, amount, description } = voiceTransactionData;

    if (amount > accountBalance) {
        const message = `Insufficient funds! Your current balance is $${accountBalance.toFixed(2)}`;
        addConversationMessage('system', message);

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
        return;
    }

    // Process transaction
    accountBalance -= amount;
    const newTransaction = {
        id: transactions.length + 1,
        description: `Transfer to ${recipient} - ${description}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        amount: -amount,
        type: 'debit',
        recipient: recipient
    };
    transactions.unshift(newTransaction);

    // Update balance display
    updateAccountBalance();

    // Send to backend (simulate PostgreSQL insert)
    sendTransactionToBackend(newTransaction);

    // Show success
    const successMessage = `Transaction successful! Sent $${amount.toFixed(2)} to ${recipient}. Your new balance is $${accountBalance.toFixed(2)}.`;
    addConversationMessage('system', successMessage);

    const utterance = new SpeechSynthesisUtterance(successMessage);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);

    // Return to main view after delay
    setTimeout(() => {
        showMainBanking();
        // Notify the voice assistant that transaction is complete
        if (typeof window.onTransactionComplete === 'function') {
            window.onTransactionComplete();
            window.onTransactionComplete = null; // Clear the callback
        }
    }, 4000);
}

/**
 * Cancel the voice transaction and return to main banking view
 */
function cancelVoiceTransaction() {
    speechSynthesis.cancel();
    showMainBanking();
    // Notify the voice assistant that transaction was canceled
    if (typeof window.onTransactionComplete === 'function') {
        window.onTransactionComplete();
        window.onTransactionComplete = null; // Clear the callback
    }
}

/**
 * Retry the current transaction step
 */
function retryCurrentStep() {
    const step = voiceTransactionData.step;
    if (step === 1) askForRecipient();
    else if (step === 2) askForAmount();
    else if (step === 3) askForDescription();
}

// ===== TRANSACTION MANAGEMENT =====

/**
 * Send transaction to backend database
 * @param {object} transaction - The transaction object to send
 */
function sendTransactionToBackend(transaction) {
    // Send to Django backend which executes PostgreSQL query
    // INSERT INTO hist_banque (bid_sender, bid_reciever, action, montant, time)

    fetch(BANKING_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sender_bank_id: '****5678',  // Current user's bank ID
            recipient: transaction.recipient,
            amount: Math.abs(transaction.amount),  // Ensure positive amount for backend
            description: transaction.description
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Transaction saved to PostgreSQL database:', data);
                console.log(`Transaction ID: ${data.transaction_id}`);
                console.log(`New Balance: $${data.new_balance}`);
            } else {
                console.error('❌ Transaction failed:', data.error);
            }
        })
        .catch(error => {
            console.error('❌ Network error:', error);
            console.log('Transaction saved locally but not synced to database');
        });
}

/**
 * Show transaction history
 */
function showTransactions() {
    document.getElementById('bankingMainView').style.display = 'none';
    document.getElementById('transactionForm').style.display = 'none';
    document.getElementById('transactionsList').style.display = 'block';
    document.getElementById('balanceDisplay').style.display = 'none';

    // Populate transactions
    const container = document.getElementById('transactionsContainer');
    container.innerHTML = '';

    if (transactions.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-600 dark:text-white/80">No transactions yet</p>';
    } else {
        transactions.forEach(transaction => {
            const transactionDiv = document.createElement('div');
            transactionDiv.className = 'flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-lg hover:shadow-md transition';
            transactionDiv.innerHTML = `
                <div>
                    <p class="font-semibold dark:text-white">${transaction.description}</p>
                    <p class="text-sm text-gray-600 dark:text-white/60">${transaction.date}</p>
                </div>
                <span class="font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </span>
            `;
            container.appendChild(transactionDiv);
        });
    }

    // Announce with voice
    const utterance = new SpeechSynthesisUtterance(`Showing ${transactions.length} transactions.`);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

/**
 * View current account balance
 */
function viewBalance() {
    document.getElementById('bankingMainView').style.display = 'none';
    document.getElementById('transactionForm').style.display = 'none';
    document.getElementById('transactionsList').style.display = 'none';
    document.getElementById('balanceDisplay').style.display = 'block';

    // Update balance display
    document.getElementById('balanceAmount').textContent = `$${accountBalance.toFixed(2)}`;

    // Announce with voice (localized)
    const balanceMessage = `${t('banking_balance_text')} ${accountBalance.toFixed(2)}`;
    const utterance = new SpeechSynthesisUtterance(balanceMessage);
    utterance.lang = getCurrentLanguageConfig().speechCode;
    speechSynthesis.speak(utterance);
}

/**
 * Update the account balance display across all views
 */
function updateAccountBalance() {
    document.getElementById('accountBalance').textContent = `$${accountBalance.toFixed(2)}`;
    document.getElementById('balanceAmount').textContent = `$${accountBalance.toFixed(2)}`;
}

// ===== BANKING VOICE CONTROL =====

const bankingVoiceOptions = [
    { name: 'banking_new_transaction', keywords: ['transaction', 'send money', 'transfer', 'pay', 'payment', 'envoyer'], action: showTransactionForm },
    { name: 'banking_view_history', keywords: ['view transactions', 'transaction history', 'history', 'transactions', 'historique'], action: showTransactions },
    { name: 'banking_check_balance', keywords: ['balance', 'check balance', 'view balance', 'solde', 'account balance'], action: viewBalance },
    { name: 'banking_back_main', keywords: ['home', 'main', 'back', 'return', 'accueil', 'retour'], action: showMainBanking }
];

/**
 * Get available banking voice options as a string
 * @returns {string} Comma-separated list of voice options
 */
function getBankingVoiceOptions() {
    return bankingVoiceOptions.map(option => t(option.name)).join(', ');
}

/**
 * Start voice control for banking operations
 */
function startBankingVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Speech recognition not supported on your browser');
        return;
    }

    // Read available options (localized)
    const message = `${t('banking_voice_banking')}. ${getBankingVoiceOptions()}.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = getCurrentLanguageConfig().speechCode;
    utterance.rate = 0.9;

    utterance.onend = () => {
        setTimeout(() => {
            listenForBankingCommand();
        }, 500);
    };

    speechSynthesis.speak(utterance);
}

/**
 * Listen for banking voice commands
 */
function listenForBankingCommand() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = getCurrentLanguageConfig().speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Create or update banking voice indicator
    let bankingIndicator = document.getElementById('bankingVoiceIndicator');
    if (!bankingIndicator) {
        bankingIndicator = document.createElement('div');
        bankingIndicator.id = 'bankingVoiceIndicator';
        document.body.appendChild(bankingIndicator);
    }

    bankingIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><span class="listening-indicator" style="color: #1976d2; font-weight: bold; font-size: 1.1em;">🎤 ${t('banking_voice_banking')}</span><br><span style="font-size: 0.9em; color: #333; margin-top: 8px; display: block;">${getBankingVoiceOptions()}</span></div>`;

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        const confidence = event.results[0][0].confidence;

        let matchedOption = null;
        let highestScore = 0;

        for (const option of bankingVoiceOptions) {
            for (const keyword of option.keywords) {
                if (transcript.includes(keyword)) {
                    const score = keyword.length;
                    if (score > highestScore) {
                        highestScore = score;
                        matchedOption = option;
                    }
                }
            }
        }

        bankingIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: ${matchedOption ? '#d4edda' : '#f8d7da'}; border: 2px solid ${matchedOption ? '#28a745' : '#dc3545'}; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><strong>You said:</strong> "${transcript}"<br><strong>Confidence:</strong> ${(confidence * 100).toFixed(0)}%<br><strong>Action:</strong> ${matchedOption ? matchedOption.name : 'No match found'}</div>`;

        if (matchedOption) {
            setTimeout(() => {
                matchedOption.action();

                setTimeout(() => {
                    bankingIndicator.remove();
                }, 3000);
            }, 1500);
        } else {
            setTimeout(() => {
                bankingIndicator.remove();
            }, 3000);
        }
    };

    recognition.onerror = (event) => {
        bankingIndicator.innerHTML = `<div style="position: fixed; bottom: 30px; right: 30px; padding: 20px; background: #f8d7da; border: 2px solid #dc3545; border-radius: 8px; z-index: 999; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"><strong style="color: #721c24;">Error:</strong> ${event.error}</div>`;
        setTimeout(() => {
            bankingIndicator.remove();
        }, 3000);
    };
}
