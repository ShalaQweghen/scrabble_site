function scrabblize(word, cont, path, blank) {
  let link = document.createElement("A");

  for (let i = 0; i < word.length; i++) {
    let div = document.createElement("DIV");

    let a = i;

    if (i > 9) {
      a = i - 9;
    } 

    div.classList.add("tLetter");
    div.classList.add("tLetter" + a);
    div.innerHTML = word.charAt(i) + "<sub>?</sub>";

    link.appendChild(div);
  }

  if (path) {
    link.href = path;
  }

  if (blank) {
    link.setAttribute("target", "_blank");
  }

  cont.appendChild(link);

  let tLetters = cont.firstChild.children;

  cont.addEventListener("mouseenter", function(event) {
    for (let i = 0; i < tLetters.length; i++) {
      tLetters[i].classList.add("undo");

      if (path) {
        tLetters[i].classList.add("undo-link");
      }
    }
  })

  cont.addEventListener("mouseleave", function(event) {
    for (let i = 0; i < tLetters.length; i++) {
      tLetters[i].classList.remove("undo");

      if (path) {
        tLetters[i].classList.remove("undo-link");
      }
    }
  })
}