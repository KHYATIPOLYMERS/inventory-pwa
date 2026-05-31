function openForm() {
  document.getElementById("productForm").style.display = "flex";
}

function closeForm() {
  document.getElementById("productForm").style.display = "none";
}

document.getElementById("form").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const stock = document.getElementById("stock").value;
  const price = document.getElementById("price").value;

  const table = document.getElementById("productTable");
  const row = table.insertRow();
  row.innerHTML = `
    <td>${name}</td>
    <td>${category}</td>
    <td>${stock}</td>
    <td>${price}</td>
    <td class="actions">
      <i class="fas fa-edit"></i>
      <i class="fas fa-trash"></i>
    </td>
  `;
  closeForm();
  this.reset();
});
