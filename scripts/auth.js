// auth.js
import { showError, clearError, validateTextField, validateAge } from './validation.js';

document.addEventListener('DOMContentLoaded', () => {

    const signInPage = document.getElementById('signInPage');
    const signUpPage = document.getElementById('signUpPage');
    const goSignUpBtn = document.getElementById('goSignUp');
    const backToSignInBtn = document.getElementById('backToSignIn');

    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    // Switch to Sign-Up
    goSignUpBtn.addEventListener('click', () => {
        signInPage.classList.add('hidden');
        signUpPage.classList.remove('hidden');
    });

    // Back to Sign-In
    backToSignInBtn.addEventListener('click', () => {
        signUpPage.classList.add('hidden');
        signInPage.classList.remove('hidden');
        signUpForm.reset();
        const inputs = signUpForm.querySelectorAll('.form-input');
        inputs.forEach(clearError);
    });

    // --- Sign-In Validation & Submit ---
    signInForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        const usernameInput = document.getElementById('signInUsername');
        const dobInput = document.getElementById('signInDOB');

        clearError(usernameInput);
        clearError(dobInput);

        if (!validateTextField(usernameInput.value)) {
            showError(usernameInput, 'Enter valid username (letters, digits, space; cannot start with digit or space).');
            valid = false;
        }

        if (!validateAge(dobInput.value)) {
            showError(dobInput, 'Age must be between 18 and 100.');
            valid = false;
        }

        if (!valid) return;

        // Successful Sign-In
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('welcome-page').classList.remove('hidden');
    });

    // --- Sign-Up Validation & Submit ---
    signUpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;

        const usernameInput = document.getElementById('signUpUsername');
        const dobInput = document.getElementById('signUpDOB');
        const answerInput = document.getElementById('signup-security-answer');
        const questionSelect = document.getElementById('signup-security-question');

        [usernameInput, dobInput, answerInput].forEach(clearError);

        if (!validateTextField(usernameInput.value)) {
            showError(usernameInput, 'Enter valid username (letters, digits, space; cannot start with digit or space).');
            valid = false;
        }

        if (!validateAge(dobInput.value)) {
            showError(dobInput, 'Age must be between 18 and 100.');
            valid = false;
        }

        if (!questionSelect.value) {
            showError(questionSelect, 'Select a security question.');
            valid = false;
        }

        if (!validateTextField(answerInput.value)) {
            showError(answerInput, 'Answer cannot be empty or invalid.');
            valid = false;
        }

        if (!valid) return;

        // Successful Sign-Up
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('welcome-page').classList.remove('hidden');
    });
});
