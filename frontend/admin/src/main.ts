import './style.css'
import { renderNavbar } from './components/navbar'
import { initRouter }   from './router'

initRouter()
window.addEventListener('load', () => {
  renderNavbar();
});

window.addEventListener('auth-changed', () => {
  renderNavbar();
});