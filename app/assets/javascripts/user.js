function addOptionListener(checkBox, list) {
  checkBox.addEventListener("change", function() {
    if (checkBox.checked) {
      for (let i = 0; i < list.length; i++) {
        list[i].classList.remove("hidden");
        list[i].classList.add("visible");
      }
    } else {
      for (let i = 0; i < list.length; i++) {
        list[i].classList.remove("visible");
        list[i].classList.add("hidden");
      }
    }
  });
}