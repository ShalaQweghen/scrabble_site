function addOptionListener(checkBox, list, klass) {
  checkBox.addEventListener("change", function() {
    if (checkBox.checked) {
      for (let i = 0; i < list.length; i++) {
        list[i].classList.remove("d-none");
      }
    } else {
      // Don't hide the related classes if their checkbox is checked
      let cbs = document.querySelectorAll("input[type='checkbox']");

      for (let i = 0; i < list.length; i++) {
        // Turn classList into a regular array
        let id = list[i].classList.toString().split(" ");
        // Remove the general played-game class
        id.shift();
        // When checkBox id filtered, a valid checkbox id remains
        id = id.filter(item => item != checkBox.id)[0];

        let hidable = true;

        for (let j = 0; j < cbs.length; j++) {
          if (cbs[j].checked) {
            if (cbs[j].id == id) {
              hidable = false;
            }
          }
        }

        if (hidable) {
          list[i].classList.add("d-none");
        }       
      }
    }
  });
}