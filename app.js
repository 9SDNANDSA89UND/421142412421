/* TamedBlox Styled Store — styles.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: #0c0f17;
  color: #ffffff;
}

/* NAVBAR */
.nav {
  width: 100%;
  padding: 22px;
  background: #0c0f17;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  font-weight: 700;
  font-size: 20px;
  color: #4ef58a;
}

.balance {
  background: #141926;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 14px;
  color: #8b92a1;
}

.nav-right {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 18px;
  border-radius: 30px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}

.btn.login {
  background: #141926;
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.1);
}

.btn.signup {
  background: #4ef58a;
  color: #000000;
}

/* HERO SECTION */
.hero {
  padding: 40px 20px;
  max-width: 1200px;
  margin: auto;
}

.hero h1 {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
}

.hero h1 span {
  color: #4ef58a;
}

.search-box {
  margin-top: 20px;
  background: #141926;
  padding: 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 100%;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 15px;
  outline: none;
}

/* FILTER BUTTONS */
.filters {
  margin-top: 18px;
  display: flex;
  gap: 10px;
}

.filter {
  padding: 8px 16px;
  background: #141926;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  font-size: 14px;
  color: white;
}

.filter.active {
  background: #4ef58a;
  color: #000;
  font-weight: 600;
}

/* STATS */
.stats {
  margin-top: 20px;
  font-size: 14px;
  color: #8b92a1;
  display: flex;
  gap: 20px;
}

/* PRODUCT GRID */
.products {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 35px;
}

.card {
  background: #121722;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 0 35px rgba(0,0,0,0.2);
}

.card img {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 12px;
}

.card h3 {
  font-size: 20px;
  font-weight: 700;
}

.card p {
  color: #8b92a1;
  margin-top: 6px;
}

.price {
  font-size: 20px;
  margin-top: 16px;
  font-weight: 700;
  color: #4ef58a;
}

.stock {
  font-size: 14px;
  color: #b0b8c8;
  margin-top: 4px;
}

.buy-btn {
  margin-top: 18px;
  width: 100%;
  padding: 12px;
  border-radius: 30px;
  background: #4ef58a;
  color: #000;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

/* FOOTER */
footer {
  text-align: center;
  padding: 25px;
  color: #8b92a1;
  font-size: 14px;
  margin-top: 40px;
}
