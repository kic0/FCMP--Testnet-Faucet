document.addEventListener('DOMContentLoaded', () => {
    const requestBtn = document.getElementById('request-btn');
    const addressInput = document.getElementById('address');
    const statusP = document.getElementById('status');
    const balanceTotalSpan = document.getElementById('balance-total');
    const balanceUnlockedSpan = document.getElementById('balance-unlocked');
    const balanceLockedSpan = document.getElementById('balance-locked');

    async function updateBalance() {
        try {
            balanceTotalSpan.textContent = 'Loading...';
            balanceUnlockedSpan.textContent = 'Loading...';
            balanceLockedSpan.textContent = 'Loading...';

            const response = await fetch('/faucet/balance');
            const data = await response.json();

            if (response.ok) {
                const total = parseFloat(data.balance) || 0;
                const unlocked = parseFloat(data.unlockedBalance) || 0;
                const locked = total - unlocked;

                balanceTotalSpan.textContent = total.toFixed(12);
                balanceUnlockedSpan.textContent = unlocked.toFixed(12);
                balanceLockedSpan.textContent = locked.toFixed(12);
            } else {
                balanceTotalSpan.textContent = 'Error';
                balanceUnlockedSpan.textContent = 'Error';
                balanceLockedSpan.textContent = 'Error';
                console.error('Failed to fetch balance:', data.error);
            }
        } catch (error) {
            balanceTotalSpan.textContent = 'Error';
            balanceUnlockedSpan.textContent = 'Error';
            balanceLockedSpan.textContent = 'Error';
            console.error('Error fetching balance:', error);
        }
    }

    requestBtn.addEventListener('click', async () => {
        const address = addressInput.value;

        if (!address) {
            statusP.textContent = 'Please enter a Monero address.';
            statusP.style.color = 'red';
            return;
        }

        statusP.textContent = 'Sending request...';
        statusP.style.color = 'white';

        try {
            const response = await fetch('/faucet/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: address, amount: '1' }), // Sending amount as a string
            });

            const result = await response.json();

            if (response.ok) {
                statusP.textContent = `Success! ${result.message}`;
                statusP.style.color = 'green';
                // Refresh balance after a short delay
                setTimeout(updateBalance, 2000);
            } else {
                statusP.textContent = `Error: ${result.error}`;
                statusP.style.color = 'red';
            }
        } catch (error) {
            statusP.textContent = 'An unexpected error occurred. See the console for details.';
            statusP.style.color = 'red';
            console.error('Faucet request error:', error);
        }
    });

    // Initial balance fetch
    updateBalance();
});