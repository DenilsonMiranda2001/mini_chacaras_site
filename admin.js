const BANNER_STORAGE_KEY = "miniChacarasBanners";
const MAX_IMAGE_BYTES = 1_200_000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const form = document.querySelector("[data-banner-form]");
const list = document.querySelector("[data-banner-list]");
const readBanners = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BANNER_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveBanners = (banners) => localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(banners));
const readImage = (fileInput, currentValue = "") => new Promise((resolve, reject) => {
  const file = fileInput.files?.[0];
  if (!file) { resolve(currentValue); return; }
  if (!ACCEPTED_TYPES.includes(file.type)) { reject(new Error("Use apenas imagens JPG, PNG ou WebP.")); return; }
  if (file.size > MAX_IMAGE_BYTES) { reject(new Error("A imagem deve ter até 1,2 MB para preservar performance.")); return; }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
  reader.readAsDataURL(file);
});
const normalizeUrl = (url) => {
  const value = url.trim();
  if (!value) return "";
  if (value.startsWith("#") || value.startsWith("/") || /^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};
const resetForm = () => {
  form.reset();
  form.elements.id.value = "";
  form.elements.order.value = "1";
  form.elements.priority.value = "normal";
  form.elements.status.value = "active";
};
const render = () => {
  const banners = readBanners().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  list.innerHTML = "";
  if (!banners.length) {
    list.innerHTML = "<article><p>Nenhum banner cadastrado. O portal exibirá o banner institucional padrão.</p></article>";
    return;
  }
  banners.forEach((banner) => {
    const article = document.createElement("article");
    article.innerHTML = `
      <header><div><span class="pill">${banner.priority}</span><h3>${banner.title}</h3></div><span class="pill">${banner.status === "active" ? "ativo" : "inativo"}</span></header>
      <p>${banner.text || "Sem texto complementar."}</p>
      <p><strong>Ordem:</strong> ${banner.order || 0} · <strong>Período:</strong> ${banner.startDate || "sem início"} até ${banner.endDate || "sem fim"}</p>
      <div class="admin-actions">
        <button class="button" type="button" data-edit="${banner.id}">Editar</button>
        <button class="button" type="button" data-toggle="${banner.id}">${banner.status === "active" ? "Desativar" : "Ativar"}</button>
        <button class="button danger" type="button" data-delete="${banner.id}">Excluir</button>
      </div>`;
    list.append(article);
  });
};
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const banners = readBanners();
  const id = form.elements.id.value || crypto.randomUUID();
  const current = banners.find((banner) => banner.id === id) || {};
  try {
    const image = await readImage(form.elements.imageFile, current.image || "assets/foto-portaria.jpg");
    const mobileImage = await readImage(form.elements.mobileImageFile, current.mobileImage || "");
    const banner = {
      id,
      image,
      mobileImage,
      alt: form.elements.alt.value.trim(),
      kicker: form.elements.kicker.value.trim(),
      title: form.elements.title.value.trim(),
      text: form.elements.text.value.trim(),
      ctaLabel: form.elements.ctaLabel.value.trim(),
      ctaUrl: normalizeUrl(form.elements.ctaUrl.value),
      status: form.elements.status.value,
      priority: form.elements.priority.value,
      order: Number(form.elements.order.value || 0),
      startDate: form.elements.startDate.value,
      endDate: form.elements.endDate.value
    };
    if (!banner.title || !banner.alt) throw new Error("Título e texto alternativo são obrigatórios.");
    if (banner.startDate && banner.endDate && banner.startDate > banner.endDate) throw new Error("A data final precisa ser posterior à data inicial.");
    saveBanners(banners.filter((item) => item.id !== id).concat(banner));
    resetForm();
    render();
  } catch (error) {
    alert(error.message);
  }
});
list.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const toggleId = event.target.dataset.toggle;
  const deleteId = event.target.dataset.delete;
  const banners = readBanners();
  if (editId) {
    const banner = banners.find((item) => item.id === editId);
    if (!banner) return;
    Object.entries(banner).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (toggleId) {
    saveBanners(banners.map((banner) => banner.id === toggleId ? { ...banner, status: banner.status === "active" ? "inactive" : "active" } : banner));
    render();
  }
  if (deleteId && confirm("Excluir este banner?")) {
    saveBanners(banners.filter((banner) => banner.id !== deleteId));
    render();
  }
});
document.querySelector("[data-new-banner]").addEventListener("click", resetForm);
document.querySelector("[data-seed-water]").addEventListener("click", () => {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 3);
  const toDate = (date) => date.toISOString().slice(0, 10);
  const banners = readBanners().filter((banner) => banner.id !== "agua-demo");
  banners.push({
    id: "agua-demo",
    image: "assets/foto-portaria.jpg",
    mobileImage: "",
    alt: "Portaria do condomínio usada como imagem institucional para comunicado de água",
    kicker: "Comunicado importante",
    title: "Atualização sobre o abastecimento de água",
    text: "Banner temporário de demonstração. Substitua por informação oficial antes de publicar.",
    ctaLabel: "Ver infraestrutura",
    ctaUrl: "index.html#infraestrutura",
    status: "active",
    priority: "high",
    order: 1,
    startDate: toDate(today),
    endDate: toDate(end)
  });
  saveBanners(banners);
  render();
});
resetForm();
render();
