function scrabblize(word, cont, path) {
  for (let i = 0; i < word.length; i++) {
    let div = document.createElement("DIV");

    let a = i;

    if (i > 9) {
      a = i - 9;
    } 

    div.classList.add("tLetter");
    div.classList.add("tLetter" + a);
    div.innerHTML = word.charAt(i) + "<sub>?</sub>";

    cont.appendChild(div);
  }


  cont.addEventListener("mouseenter", function(event) {
    for (let i = 0; i < cont.children.length; i++) {
      cont.children[i].classList.add("undo");

      if (path) {
        cont.children[i].classList.add("undo-link");
      }
    }
  })

  cont.addEventListener("mouseleave", function(event) {
    for (let i = 0; i < cont.children.length; i++) {
      cont.children[i].classList.remove("undo");

      if (path) {
        cont.children[i].classList.remove("undo-link");
      }
    }
  })

  if (path) {
    cont.addEventListener("click", function(event) {
      window.location.href = path;
    })
  }
}