package com.elp.usuarios_service.security;

import com.elp.usuarios_service.model.UsuarioBase;
import com.elp.usuarios_service.repository.UsuarioBaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioBaseRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UsuarioBase usuario = null;
        try {
            java.util.UUID id = java.util.UUID.fromString(username);
            usuario = usuarioRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException e) {
            // No es un UUID, se buscará por email
        }

        if (usuario == null) {
            usuario = usuarioRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con identificador: " + username));
        }

        return new UserDetailsImpl(usuario);
    }
}
