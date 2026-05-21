import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CrearOrdenProduccion.module.css";


const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "https://frozenback-test.up.railway.app"; 


const cleanBaseURL = rawBaseURL.endsWith("/api") || rawBaseURL.endsWith("/api/") 
  ? rawBaseURL 
  : `${rawBaseURL.replace(/\/$/, "")}/api/`;

const api = axios.create({
  baseURL: cleanBaseURL,
  timeout: 10000,
});

const CrearOrdenProduccion = () => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    startDate: "",
    product: "",
    quantity: "",
  });

  const [alert, setAlert] = useState({ message: "", type: "", visible: false });
  const [productOptions, setProductOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responsable, setResponsable] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductUnit, setSelectedProductUnit] = useState("");
  const [errors, setErrors] = useState({
    product: "",
    quantity: "",
    startDate: "",
  });
  const [touched, setTouched] = useState({
    product: false,
    quantity: false,
    startDate: false,
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Efecto para validar el formulario completo cuando cambien los datos
  useEffect(() => {
    validateForm();
  }, [formData]);

  // Función para validar si el formulario completo es válido
  const validateForm = () => {
    const { product, quantity, startDate } = formData;
    const isValid =
      product.trim() !== "" &&
      quantity.trim() !== "" &&
      !isNaN(quantity) &&
      parseInt(quantity) > 0 &&
      startDate.trim() !== "";

    setIsFormValid(isValid);
    return isValid;
  };

  // --- 🛡️ FUNCIONES DE CARGA EN LA RAÍZ DEL COMPONENTE (FUERA DE LOS HOOKS) ---
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Con la URL base unificada en /api/, esta llamada se concatena de forma perfecta
      const productosResponse = await api.get("productos/productos/");

      if (typeof productosResponse.data === 'string' && productosResponse.data.includes('<!doctype html>')) {
        throw new Error("El servidor devolvió un HTML de rescate en lugar del JSON de productos.");
      }

      const productsArray = productosResponse.data?.results || (Array.isArray(productosResponse.data) ? productosResponse.data : []);

      if (!Array.isArray(productsArray)) {
        throw new Error("La respuesta de productos no contiene un formato válido");
      }

      const transformedProducts = productsArray.map((product) => ({
        value: (product.id_producto || product.id || "").toString(),
        label: product.nombre || product.descripcion || "Producto sin nombre",
        descripcion: product.descripcion || "",
        unidad_medida: product.unidad?.descripcion || product.id_unidad?.descripcion || product.unidad_medida || "Unidades",
      }));

      if (transformedProducts.length === 0) {
        throw new Error("No se encontraron productos en el catálogo");
      }

      setProductOptions(transformedProducts);

    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage = error.response?.data?.message || error.message;
      showAlert("Error al cargar los datos: " + errorMessage, "error");
      setProductOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerUsuario = () => {
    try {
      const usuarioStorage = localStorage.getItem("usuario");
      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        if (usuario.nombre && usuario.apellido) {
          setResponsable(`${usuario.nombre} ${usuario.apellido}`);
        }
        if (usuario.id_empleado) {
          setIdUsuario(usuario.id_empleado.toString());
        }
      }
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      setResponsable("Usuario no identificado");
    }
  };

  // 🛡️ EFECTO DE INICIALIZACIÓN CONFIGURADO EN LA RAÍZ DEL COMPONENTE
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    setFormData((prev) => ({
      ...prev,
      startDate: tomorrowISO,
    }));

    obtenerUsuario();
    fetchData();
  }, []);
  
  const validarCampo = (name, value) => {
    switch (name) {
      case "product":
        if (!value.trim()) {
          return "Debes seleccionar un producto";
        }
        return "";

      case "quantity":
        if (!value || value === "") {
          return "La cantidad es obligatoria";
        }
        if (isNaN(value) || parseInt(value) < 1) {
          return "La cantidad debe ser un número mayor a 0";
        }
        return "";

      case "startDate":
        if (!value.trim()) {
          return "La fecha de inicio es obligatoria";
        }
        
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
          return "La fecha de inicio debe ser posterior a la fecha actual";
        }
        return "";

      default:
        return "";
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {
      product: validarCampo("product", formData.product),
      quantity: validarCampo("quantity", formData.quantity),
      startDate: validarCampo("startDate", formData.startDate),
    };

    setErrors(nuevosErrores);
    setTouched({
      product: true,
      quantity: true,
      startDate: true,
    });

    const isValid = !Object.values(nuevosErrores).some((error) => error !== "");
    setIsFormValid(isValid);
    return isValid;
  };

  const mostrarCamposIncompletos = () => {
    const nuevosErrores = {
      product: validarCampo("product", formData.product),
      quantity: validarCampo("quantity", formData.quantity),
      startDate: validarCampo("startDate", formData.startDate),
    };

    setErrors(nuevosErrores);
    setTouched({
      product: true,
      quantity: true,
      startDate: true,
    });

    const camposFaltantes = [];
    if (nuevosErrores.product) camposFaltantes.push("Producto");
    if (nuevosErrores.quantity) camposFaltantes.push("Cantidad");
    if (nuevosErrores.startDate) camposFaltantes.push("Fecha de Inicio");

    if (camposFaltantes.length > 0) {
      showAlert(
        `Complete los siguientes campos: ${camposFaltantes.join(", ")}`,
        "error"
      );
    }

    return camposFaltantes.length === 0;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validarCampo(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "product") {
      const selectedProduct = productOptions.find(
        (product) => product.value === value
      );
      setSelectedProductUnit(
        selectedProduct ? selectedProduct.unidad_medida : ""
      );

      setFormData((prev) => ({
        ...prev,
        product: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (touched[name]) {
      const error = validarCampo(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (errors[name] && value) {
      const error = validarCampo(name, value);
      if (!error) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }

    if (submitAttempted && value.trim() !== "") {
      setSubmitAttempted(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const enviarOrdenProduccion = async (ordenData) => {
    try {
      const response = await api.post("produccion/ordenes/", ordenData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const esValido = mostrarCamposIncompletos();
    if (!esValido) return;

    if (!idUsuario) {
      showAlert(
        "No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.",
        "error"
      );
      return;
    }

    setSubmitting(true);

    try {
      const ordenData = {
        id_supervisor: parseInt(idUsuario),
        id_producto: parseInt(formData.product),
        cantidad: parseInt(formData.quantity),
        fecha_inicio: formData.startDate,
      };

      await enviarOrdenProduccion(ordenData);
      showAlert("¡Orden de producción creada exitosamente!", "success");

      setTimeout(() => {
        resetForm();
        setSubmitting(false);
        setSubmitAttempted(false);
      }, 2000);
    } catch (error) {
      console.error("Error al crear orden:", error);
      showAlert(`Error al crear la orden: ${error.message}`, "error");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString().split("T")[0];

    setFormData({
      startDate: tomorrowISO,
      product: "",
      quantity: "",
    });
    setSelectedProductUnit("");
    setErrors({ product: "", quantity: "", startDate: "" });
    setTouched({ product: false, quantity: false, startDate: false });
    setIsFormValid(false);
    setSubmitAttempted(false);
  };

  const shouldShowError = (fieldName) => {
    return (touched[fieldName] || submitAttempted) && errors[fieldName];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crear Orden de Producción</h1>

      <div className={styles.formWrapper}>
        <div className={styles.divFormulario}>
          {alert.visible && (
            <div className={`${styles.alert} ${styles[`alert${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}`]}`}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="responsable" className={styles.formLabel}>Responsable</label>
                  <input type="text" id="responsable" value={responsable} disabled className={`${styles.formInput} ${styles.disabledInput}`} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.formLabel}>Fecha de Inicio Planificada *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={submitting}
                    min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}
                    className={`${styles.formInput} ${shouldShowError("startDate") ? styles.inputError : ""} ${submitting ? styles.disabledInput : ""}`}
                  />
                  {shouldShowError("startDate") && <span className={styles.errorText}>{errors.startDate}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="product" className={styles.formLabel}>Producto *</label>
                  <select
                    id="product"
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={submitting || productOptions.length === 0}
                    className={`${styles.formInput} ${shouldShowError("product") ? styles.inputError : ""} ${submitting ? styles.disabledInput : ""}`}
                  >
                    <option value="" disabled hidden>
                      {productOptions.length === 0 ? "No hay productos disponibles" : "Seleccione una opción"}
                    </option>
                    {productOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {shouldShowError("product") && <span className={styles.errorText}>{errors.product}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="quantity" className={styles.formLabel}>Cantidad{selectedProductUnit && ` (${selectedProductUnit})`} *</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="1"
                    required
                    disabled={submitting}
                    placeholder={selectedProductUnit ? `Ingrese la cantidad en ${selectedProductUnit}` : "Ingrese la cantidad"}
                    className={`${styles.formInput} ${shouldShowError("quantity") ? styles.inputError : ""} ${submitting ? styles.disabledInput : ""}`}
                  />
                  {shouldShowError("quantity") && <span className={styles.errorText}>{errors.quantity}</span>}
                </div>
              </div>
            </div>

            <div className={styles.requiredInfo}>
              <small>* Campos obligatorios</small>
              {submitAttempted && !isFormValid && (
                <small className={styles.validationError}>❌ Complete todos los campos requeridos marcados en rojo</small>
              )}
            </div>

            <div className={styles.actionsContainer}>
              <button type="submit" className={`${styles.submitButton} ${submitting ? styles.submitButtonLoading : ""}`} disabled={submitting}>
                {submitting ? (
                  <div className={styles.buttonLoadingContent}>
                    <div className={styles.spinnerSmall}></div>
                    <span>Creando...</span>
                  </div>
                ) : ("Crear Orden")}
              </button>
            </div>

            {submitting && (
              <div className={styles.creatingOverlay}>
                <div className={styles.creatingContent}>
                  <div className={styles.spinner}></div>
                  <p className={styles.creatingText}>Creando orden de producción, por favor espere...</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CrearOrdenProduccion;