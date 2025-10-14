// PURPOSE: TO RESET THE GAME UI TO AVOID MANUAL REFRESH TO RESTORE THE SCRIPT LOAD

// Game Control Buttons (from updated HTML)
const addRowBtn = document.getElementById('addRowBtn'); 
const completeBtn = document.getElementById('completeBtn');
// Error Display Area (using the correct ID 'statusMessage')
const errorDisplayArea = document.getElementById('statusMessage'); 
export function resetGameAction() {
    addRowBtn.textContent = 'Next Round';
    addRowBtn.disabled = false;
    addRowBtn.style.backgroundColor = ''; // or original color
    addRowBtn.style.color = '#ffffff'; // or original color
    completeBtn.style.display = 'inline-block'; // show complete button

    // Clear any status message and styling
    errorDisplayArea.textContent = '';
    errorDisplayArea.style.display='none';
}