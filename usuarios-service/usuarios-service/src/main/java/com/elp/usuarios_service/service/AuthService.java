package com.elp.usuarios_service.service;

import com.elp.usuarios_service.dto.AuthResponse;
import com.elp.usuarios_service.dto.LoginRequest;
import com.elp.usuarios_service.dto.RegisterEmpresaRequest;
import com.elp.usuarios_service.dto.RegisterEstudianteRequest;
import com.elp.usuarios_service.model.Empresa;
import com.elp.usuarios_service.model.Estudiante;
import com.elp.usuarios_service.model.UsuarioBase;
import com.elp.usuarios_service.model.enums.EstadoCuenta;
import com.elp.usuarios_service.model.enums.Rol;
import com.elp.usuarios_service.repository.EmpresaRepository;
import com.elp.usuarios_service.repository.EstudianteRepository;
import com.elp.usuarios_service.repository.UsuarioBaseRepository;
import com.elp.usuarios_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioBaseRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UsuarioBase usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new com.elp.usuarios_service.exception.InvalidCredentialsException("Credenciales inválidas"));

        String token = jwtUtil.generateToken(usuario);
        return AuthResponse.builder().token(token).build();
    }

    public boolean existeDni(String dni) {
        if (dni == null || dni.trim().isEmpty()) {
            return false;
        }
        return estudianteRepository.findByDni(dni.trim()).isPresent();
    }

    public boolean existeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return usuarioRepository.findByEmail(email.trim().toLowerCase()).isPresent();
    }

    public AuthResponse registrarEstudiante(RegisterEstudianteRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new com.elp.usuarios_service.exception.DuplicateResourceException("El email ya está registrado");
        }
        if (estudianteRepository.findByDni(request.getDni()).isPresent()) {
            throw new com.elp.usuarios_service.exception.DuplicateResourceException("El DNI ya está registrado");
        }

        Estudiante estudiante = Estudiante.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefonoWhatsapp())
                .rol(Rol.ESTUDIANTE)
                .estadoCuenta(EstadoCuenta.PENDIENTE_VERIFICACION)
                .dni(request.getDni())
                .nombres(request.getNombres())
                .apellidos(request.getApellidos())
                .biografia(null)
                .tituloProfesional(null)
                .ubicacion(null)
                .enlacePortafolio(request.getEnlacePortafolio())
                .urlCvPdf(request.getUrlCvPdf())
                .build();

        estudianteRepository.save(estudiante);

        String token = jwtUtil.generateToken(estudiante);
        return AuthResponse.builder().token(token).build();
    }

    @Transactional
    public AuthResponse registrarEmpresa(RegisterEmpresaRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new com.elp.usuarios_service.exception.DuplicateResourceException("El email ya está registrado");
        }
        if (empresaRepository.findByRuc(request.getRuc()).isPresent()) {
            throw new com.elp.usuarios_service.exception.DuplicateResourceException("El RUC ya está registrado");
        }

        Empresa empresa = Empresa.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefonoWhatsapp())
                .rol(Rol.EMPRESA)
                .estadoCuenta(EstadoCuenta.PENDIENTE_VERIFICACION)
                .ruc(request.getRuc())
                .razonSocial(request.getRazonSocial())
                .nombreComercial(request.getNombreComercial())
                .sitioWeb(request.getSitioWeb())
                .estadoVerificacion("PENDIENTE")
                .build();

        empresaRepository.save(empresa);

        String token = jwtUtil.generateToken(empresa);
        return AuthResponse.builder().token(token).build();
    }

    public com.elp.usuarios_service.dto.UsuarioResponseDTO obtenerUsuarioActual(String email) {
        UsuarioBase usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new com.elp.usuarios_service.exception.InvalidCredentialsException("Usuario no encontrado"));

        String nombre = "";
        if (usuario instanceof Estudiante) {
            Estudiante e = (Estudiante) usuario;
            nombre = e.getNombres() + " " + e.getApellidos();
        } else if (usuario instanceof Empresa) {
            nombre = ((Empresa) usuario).getRazonSocial();
        }

        return com.elp.usuarios_service.dto.UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .nombre(nombre)
                .estadoCuenta(usuario.getEstadoCuenta())
                .emailVerificado(usuario.getEmailVerificado())
                .build();
    }
}
