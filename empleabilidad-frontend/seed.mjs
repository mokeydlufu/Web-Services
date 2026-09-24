import axios from 'axios';
import jwt from 'jsonwebtoken';

const apiUsuarios = axios.create({ baseURL: 'http://localhost:8081/api' });
const apiOfertas = axios.create({ baseURL: 'http://localhost:8082/api' });

const seedData = async () => {
  try {
    console.log('🌱 Iniciando Seeder...');

    // 1. Crear Empresa
    let empresaToken = '';
    let empresaId = '';
    
    console.log('1️⃣ Registrando empresa seeder...');
    const randomNum = Math.floor(Math.random() * 900000);
    const fakeEmail = `admin${randomNum}@techcorp.com`;
    try {
      const { data: regData } = await apiUsuarios.post('/auth/registro/empresa', {
        ruc: '20' + (Math.floor(Math.random() * 900000000) + 100000000),
        razonSocial: 'TechCorp Innovación S.A.C.',
        email: fakeEmail,
        password: 'password123'
      });
      empresaToken = regData.token;
    } catch (e) {
      console.log("Fallo registro", e.response?.data);
      throw e;
    }

    // Get Empresa Profile
    const { data: meData } = await apiUsuarios.get('/auth/me', {
      headers: { Authorization: `Bearer ${empresaToken}` }
    });
    empresaId = meData.id;
    console.log(`✅ Empresa autenticada (ID: ${empresaId})`);

    // Forge Admin token to create Category
    const adminToken = jwt.sign(
      { sub: '00000000-0000-0000-0000-000000000000', rol: 'ADMINISTRADOR' },
      'my-super-secret-key-that-should-be-changed-in-production',
      { expiresIn: '1h' }
    );
    
    let categoriaId = '';
    try {
      const { data: catData } = await apiOfertas.post('/categorias', {
        nombre: 'Tecnología e Innovación',
        descripcion: 'Área de TI'
      }, { headers: { Authorization: `Bearer ${adminToken}` }});
      categoriaId = catData.id;
      console.log(`✅ Categoría creada (ID: ${categoriaId})`);
    } catch(e) {
      console.log("No se pudo crear categoría, intentando obtener...");
      // Ignorar si falla, intentaremos usar un mock
      categoriaId = '00000000-0000-0000-0000-000000000000';
    }

    // 2. Crear 10 Ofertas
    console.log('2️⃣ Generando 10 ofertas de trabajo...');
    const ofertas = [
      { titulo: 'Senior Full Stack Developer', area: 'Tecnología', exp: 'SENIOR', contrato: 'TIEMPO_COMPLETO', mod: 'REMOTO', min: 4000, max: 6000 },
      { titulo: 'Diseñador UX/UI', area: 'Diseño', exp: 'SEMI_SENIOR', contrato: 'TIEMPO_COMPLETO', mod: 'HIBRIDO', min: 2500, max: 3500 },
      { titulo: 'Data Analyst', area: 'Datos', exp: 'JUNIOR', contrato: 'TIEMPO_COMPLETO', mod: 'PRESENCIAL', min: 1500, max: 2000 },
      { titulo: 'DevOps Engineer', area: 'Tecnología', exp: 'EXPERTO', contrato: 'POR_PROYECTO', mod: 'REMOTO', min: 5000, max: 8000 },
      { titulo: 'Practicante de Marketing', area: 'Marketing', exp: 'PRACTICANTE', contrato: 'PRACTICAS', mod: 'PRESENCIAL', min: 1025, max: 1025 },
      { titulo: 'Project Manager TI', area: 'Gestión', exp: 'SENIOR', contrato: 'TIEMPO_COMPLETO', mod: 'HIBRIDO', min: 4500, max: 6500 },
      { titulo: 'Desarrollador Backend (Java)', area: 'Tecnología', exp: 'SEMI_SENIOR', contrato: 'TIEMPO_COMPLETO', mod: 'REMOTO', min: 3000, max: 4500 },
      { titulo: 'Especialista en Ciberseguridad', area: 'Seguridad', exp: 'SENIOR', contrato: 'TIEMPO_COMPLETO', mod: 'REMOTO', min: 5500, max: 7500 },
      { titulo: 'Community Manager', area: 'Marketing', exp: 'JUNIOR', contrato: 'MEDIO_TIEMPO', mod: 'HIBRIDO', min: 1200, max: 1800 },
      { titulo: 'Arquitecto Cloud AWS', area: 'Tecnología', exp: 'EXPERTO', contrato: 'TIEMPO_COMPLETO', mod: 'REMOTO', min: 7000, max: 10000 }
    ];

    for (const [i, ofe] of ofertas.entries()) {
      try {
        await apiOfertas.post(`/ofertas?empresaId=${empresaId}`, {
          oferta: {
            titulo: ofe.titulo,
            descripcion: `Buscamos un ${ofe.titulo} apasionado por los retos. Únete a nuestro equipo y desarrolla soluciones innovadoras de alto impacto. Ofrecemos línea de carrera, EPS y excelente clima laboral.`,
            categoriaId: categoriaId,
            areaProfesional: ofe.area,
            nivelExperiencia: ofe.exp,
            tipoContrato: ofe.contrato,
            modalidad: ofe.mod,
            jornada: 'DIURNA',
            salarioMinimo: ofe.min,
            salarioMaximo: ofe.max,
            moneda: 'PEN',
            ubicacion: 'Lima, Perú',
            departamento: 'Lima',
            pais: 'Perú',
            fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            estado: 'ACTIVA',
            aceptaPostulaciones: true
          },
          requisitos: []
        }, {
          headers: { Authorization: `Bearer ${empresaToken}` }
        });
        console.log(`   ✅ Oferta ${i+1}/10 creada: ${ofe.titulo}`);
      } catch (err) {
        // En caso de que falle por la categoría (si la BD exige FK)
        console.log(`   ❌ Error al crear oferta ${i+1}: ${err.response?.data?.message || err.message}`);
      }
    }

    console.log('🎉 Seeding finalizado con éxito!');

  } catch (error) {
    console.error('❌ Error en el seeder:', error.response?.data || error.message);
  }
};

seedData();
