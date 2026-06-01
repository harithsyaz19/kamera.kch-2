.App {
  min-height: 100vh;
  background-color: white;
}

button {
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

input, textarea {
  transition: border-color 0.2s;
}

input:focus, textarea:focus {
  outline: none;
}

.calendar-disabled {
  opacity: 0.3;
  text-decoration: line-through;
  pointer-events: none;
  background: transparent !important;
  color: rgb(180 180 180) !important;
}
