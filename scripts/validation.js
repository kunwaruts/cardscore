// Function to display an inline error message next to the input field
export function displayError(inputElement, message) {
    const inputGroup = inputElement.closest('.input-group');
    if (!inputGroup) return;

    // 1. Add red highlight to the input group
    inputGroup.classList.add('error');
    
    // 2. Find the error message container
    let errorContainer = inputGroup.querySelector('.input-error-message');

    if (errorContainer) {
        // Remove the 'hidden' class and set the message
        errorContainer.classList.remove('hidden'); 
        errorContainer.innerHTML = `⚠ ${message}`;
    }
}

// Function to clear errors
export function clearError(inputElement) {
    const inputGroup = inputElement.closest('.input-group');
    if (!inputGroup) return;

    // 1. Remove red highlight
    inputGroup.classList.remove('error');

    // 2. Hide the error message container
    const errorContainer = inputGroup.querySelector('.input-error-message');
    if (errorContainer) {
        // Add the 'hidden' class back
        errorContainer.classList.add('hidden'); 
        errorContainer.textContent = ''; // Clear the message content
    }
}

// Clears all errors on a form
export function clearAllFormErrors(formElement) {
    const inputs = formElement.querySelectorAll('.form-input, select');
    inputs.forEach(input => clearError(input));
}

// In scripts/validation.js (Add these functions and export them)

// Function to check if a string meets the new username/answer rules
export function validateTextRule(inputElement, value, fieldName) {
    // Defensive Check: auth.js handles the "Required" error, exit if empty.
    if (!value || value.length === 0) {
        return false; 
    }
    
    clearError(inputElement); // Clear previous errors before running new checks
    let isValid = true;
    
    // 1. Check for illegal characters (anything not a letter, number, dot, underscore, or hyphen)
    if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
        displayError(inputElement, `${fieldName} can only contain letters, numbers, periods (.), underscores (_), and hyphens (-).`);
        isValid = false;
    }

    // 2. Cannot start with digit or character (i.e., must start with an alphabet)
    // Only check this if it hasn't failed the previous check (to prioritize error messages)
    if (isValid && !/^[a-zA-Z]/.test(value)) {
        displayError(inputElement, `${fieldName} can start with Alphabet only.`);
        isValid = false;
    } 

    // 3. Min 5 characters check
    if (isValid && value.length < 5) {
        displayError(inputElement, `${fieldName} must be at least 5 characters.`);
        isValid = false;
    }
    
    // Only clear the error if ALL checks were passed
    if (isValid) {
        clearError(inputElement);
    }
    
    return isValid;
}

// Function to calculate age
export function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if the birth month/day hasn't occurred yet this year
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
