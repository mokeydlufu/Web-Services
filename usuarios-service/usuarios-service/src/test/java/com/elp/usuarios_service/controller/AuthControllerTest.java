package com.elp.usuarios_service.controller;

import com.elp.usuarios_service.dto.LoginRequest;
import com.elp.usuarios_service.dto.RegisterEstudianteRequest;
import com.elp.usuarios_service.dto.RegisterEmpresaRequest;
import com.elp.usuarios_service.model.Estudiante;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.model.enums.Rol;
import com.elp.usuarios_service.repository.UsuarioBaseRepository;
import com.elp.usuarios_service.repository.EstudianteRepository;
import com.elp.usuarios_service.repository.EmpresaRepository;
import com.elp.usuarios_service.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class AuthControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UsuarioBaseRepository usuarioRepository;

    @Autowired
    private EstudianteRepository estudianteRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
        usuarioRepository.deleteAll();
    }

    @Test
    void debeRegistrarEstudianteExitosamente() throws Exception {
        RegisterEstudianteRequest request = RegisterEstudianteRequest.builder()
                .email("estudiante@test.com")
                .password("password123")
                .dni("12345678")
                .nombres("Juan")
                .apellidos("Perez")
                .build();

        mockMvc.perform(post("/api/auth/registro/estudiante")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void debeFallarRegistroEstudiantePorEmailDuplicado() throws Exception {
        Estudiante est = new Estudiante();
        est.setEmail("duplicado@test.com");
        est.setPassword(passwordEncoder.encode("password123"));
        est.setDni("87654321");
        est.setNombres("Maria");
        est.setApellidos("Gomez");
        est.setRol(Rol.ESTUDIANTE);
        estudianteRepository.save(est);

        RegisterEstudianteRequest request = RegisterEstudianteRequest.builder()
                .email("duplicado@test.com")
                .password("password123")
                .dni("11223344")
                .nombres("Carlos")
                .apellidos("Lopez")
                .build();

        mockMvc.perform(post("/api/auth/registro/estudiante")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void debeFallarRegistroEstudiantePorDniDuplicado() throws Exception {
        Estudiante est = new Estudiante();
        est.setEmail("usuario1@test.com");
        est.setPassword(passwordEncoder.encode("password123"));
        est.setDni("87654321");
        est.setNombres("Maria");
        est.setApellidos("Gomez");
        est.setRol(Rol.ESTUDIANTE);
        estudianteRepository.save(est);

        RegisterEstudianteRequest request = RegisterEstudianteRequest.builder()
                .email("usuario2@test.com")
                .password("password123")
                .dni("87654321")
                .nombres("Carlos")
                .apellidos("Lopez")
                .build();

        mockMvc.perform(post("/api/auth/registro/estudiante")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El DNI ya está registrado"));
    }

    @Test
    void debeDetectarDniDuplicadoEnCheckDni() throws Exception {
        Estudiante est = new Estudiante();
        est.setEmail("usuario1@test.com");
        est.setPassword(passwordEncoder.encode("password123"));
        est.setDni("44332211");
        est.setNombres("Rosa");
        est.setApellidos("Perez");
        est.setRol(Rol.ESTUDIANTE);
        estudianteRepository.save(est);

        mockMvc.perform(get("/api/auth/check-dni/44332211"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.exists").value(true))
                .andExpect(jsonPath("$.disponible").value(false))
                .andExpect(jsonPath("$.message").value("El DNI ya está registrado"));
    }

    @Test
    void debeAprobarDniDisponibleEnCheckDni() throws Exception {
        mockMvc.perform(get("/api/auth/check-dni/99998888"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(false))
                .andExpect(jsonPath("$.disponible").value(true))
                .andExpect(jsonPath("$.message").value("DNI disponible"));
    }

    @Test
    void debeHacerLoginExitosamente() throws Exception {
        Estudiante est = new Estudiante();
        est.setEmail("login@test.com");
        est.setPassword(passwordEncoder.encode("password123"));
        est.setDni("99887766");
        est.setNombres("Ana");
        est.setApellidos("Ruiz");
        est.setRol(Rol.ESTUDIANTE);
        est.setEstadoCuenta(com.elp.usuarios_service.model.enums.EstadoCuenta.ACTIVA);
        estudianteRepository.save(est);

        LoginRequest request = new LoginRequest("login@test.com", "password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void debeFallarLoginConCredencialesInvalidas() throws Exception {
        LoginRequest request = new LoginRequest("noexiste@test.com", "wrongpass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeObtenerUsuarioActualConTokenValido() throws Exception {
        Estudiante est = new Estudiante();
        est.setEmail("me@test.com");
        est.setPassword(passwordEncoder.encode("password123"));
        est.setDni("55555555");
        est.setNombres("Test");
        est.setApellidos("User");
        est.setRol(Rol.ESTUDIANTE);
        est.setEstadoCuenta(com.elp.usuarios_service.model.enums.EstadoCuenta.ACTIVA);
        estudianteRepository.save(est);

        String token = jwtUtil.generateToken(est);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@test.com"))
                .andExpect(jsonPath("$.rol").value("ESTUDIANTE"));
    }

    @Test
    void debeRechazarAccesoSinToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void debeRechazarAccesoConTokenInvalido() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer tokeninvalido"))
                .andExpect(status().isForbidden());
    }
}
