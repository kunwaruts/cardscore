// validation.js

/**
 * Displays error message and highlights the input field
 * @param {HTMLElement} inputElement 
 * @param {string} message 
 */
export function showError(inputElement, message) {
    inputElement.classList.add('input-error');

    let existingMsg = inputElement.nextElementSibling;
    if (!existingMsg || !existingMsg.classList.contains('inline-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('inline-error', 'text-red-500', 'text-sm', 'mt-1');
        errorDiv.innerHTML = `⚠ ${message}`;
        inputElement.parentNode.appendChild(errorDiv);
    } else {
        existingMsg.innerHTML = `⚠ ${message}`;
    }
}

/**
 * Clears error message and removes highlight
 * @param {HTMLElement} inputElement 
 */
export function clearError(inputElement) {
    inputElement.classList.remove('input-error');
    let existingMsg = inputElement.nextElementSibling;
    if (existingMsg && existingMsg.classList.contains('inline-error')) {
        existingMsg.remove();
    }
}

/**
 * Validates username or answer input
 * Rules:
 * - cannot be empty
 * - can contain alphabets, digits, and spaces
 * - cannot start with digit or space
 * - only space not allowed
 * @param {string} value
 * @returns {boolean}
 */
export function validateTextField(value) {
    if (!value.trim()) return false;
    const regex = /^[A-Za-z][A-Za-z0-9 ]*$/;
    return regex.test(value.trim());
}

/**
 * Validates age (DOB)
 * @param {string} dobString (YYYY-MM-DD)
 * @returns {boolean}
 */
export function validateAge(dobString) {
    if (!dobString) return false;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18 && age <= 100;
}
