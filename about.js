const printResume = document.querySelector('[data-print-resume]');
if (printResume) {
  printResume.hidden = false;
  printResume.addEventListener('click', () => window.print());
}
