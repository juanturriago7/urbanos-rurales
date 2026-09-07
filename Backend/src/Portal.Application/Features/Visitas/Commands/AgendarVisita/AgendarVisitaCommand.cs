using FluentValidation;
using MediatR;
using Portal.Application.Common;
using Portal.Application.Features.Visitas.DTOs;

namespace Portal.Application.Features.Visitas.Commands.AgendarVisita;

/// <summary>
/// Solicitud pública de visita a un inmueble (POST /api/visitas). Crea el evento
/// en la agenda corporativa (Microsoft 365) y notifica por correo. No se persiste
/// en una tabla propia: la visita vive en el calendario del buzón configurado.
/// <para><see cref="Sitio"/> es un honeypot anti-spam (RNF-023): oculto para
/// humanos, lo llenan los bots.</para>
/// </summary>
public sealed record AgendarVisitaCommand(
    long InmuebleId,
    string Nombre,
    string Correo,
    string? Telefono,
    string Fecha,      // "yyyy-MM-dd" en hora de Colombia
    string Franja,     // "HH:mm" — inicio del slot de 1 hora
    string? Mensaje,
    bool AceptoTratamientoDatos,
    string? Sitio) : IRequest<Result<AgendarVisitaResponse>>
{
    /// <summary>La asigna el controller desde la conexión; no viene en el body.</summary>
    public string? IpOrigen { get; set; }
}

/// <summary>
/// Reglas de agendamiento: horario laboral, slots de 1 hora y una antelación
/// mínima. Colombia es UTC-5 fijo (sin horario de verano), así que la hora local
/// se obtiene con un desfase constante.
/// </summary>
public static class ReglasAgenda
{
    public static readonly TimeSpan DesfaseColombia = TimeSpan.FromHours(-5);
    public static readonly TimeSpan DuracionVisita = TimeSpan.FromHours(1);

    /// <summary>Antelación mínima entre "ahora" y el inicio del slot.</summary>
    public static readonly TimeSpan AntelacionMinima = TimeSpan.FromHours(3);

    /// <summary>Ventana máxima hacia adelante para agendar.</summary>
    public static readonly int DiasMaximosAdelante = 60;

    public static DateTime AhoraEnColombia => DateTime.UtcNow + DesfaseColombia;

    /// <summary>
    /// Hora de inicio (incluida) y fin (excluida) de la jornada para un día dado.
    /// <c>Desde == Hasta</c> los domingos (no se atienden visitas).
    /// </summary>
    public static (int Desde, int Hasta) JornadaDe(DayOfWeek dia) => dia switch
    {
        DayOfWeek.Monday or DayOfWeek.Tuesday or DayOfWeek.Wednesday
            or DayOfWeek.Thursday or DayOfWeek.Friday => (8, 18),
        DayOfWeek.Saturday => (9, 13),
        _ => (0, 0),
    };

    /// <summary>Slots "HH:mm" válidos para un día (vacío si no se atiende).</summary>
    public static IReadOnlyList<string> SlotsDe(DayOfWeek dia)
    {
        var (desde, hasta) = JornadaDe(dia);

        var slots = new List<string>();
        for (var h = desde; h < hasta; h++)
        {
            slots.Add($"{h:00}:00");
        }

        return slots;
    }

    /// <summary>
    /// Valida <paramref name="fecha"/> + <paramref name="franja"/> y, si son
    /// correctos, entrega el instante local de inicio.
    /// </summary>
    public static bool TryResolverInicio(
        string fecha, string franja, out DateTime inicioLocal, out string? error)
    {
        inicioLocal = default;
        error = null;

        if (!DateOnly.TryParseExact(fecha, "yyyy-MM-dd", out var dia))
        {
            error = "La fecha no tiene el formato yyyy-MM-dd.";
            return false;
        }

        if (!TimeOnly.TryParseExact(franja, "HH:mm", out var hora))
        {
            error = "La franja no tiene el formato HH:mm.";
            return false;
        }

        var inicio = dia.ToDateTime(hora, DateTimeKind.Unspecified);

        if (!SlotsDe(inicio.DayOfWeek).Contains(franja))
        {
            error = "La franja está fuera del horario de atención para ese día.";
            return false;
        }

        var ahora = AhoraEnColombia;

        if (inicio < ahora + AntelacionMinima)
        {
            error = $"La visita debe solicitarse con al menos {AntelacionMinima.TotalHours:0} horas de antelación.";
            return false;
        }

        if (inicio > ahora.AddDays(DiasMaximosAdelante))
        {
            error = $"Solo se puede agendar hasta {DiasMaximosAdelante} días adelante.";
            return false;
        }

        inicioLocal = inicio;
        return true;
    }
}

public sealed class AgendarVisitaCommandValidator : AbstractValidator<AgendarVisitaCommand>
{
    public AgendarVisitaCommandValidator()
    {
        RuleFor(x => x.InmuebleId).GreaterThan(0);
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Correo).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Telefono).MaximumLength(30);
        RuleFor(x => x.Mensaje).MaximumLength(2_000);

        RuleFor(x => x.AceptoTratamientoDatos)
            .Equal(true)
            .WithMessage("Debe aceptar el tratamiento de datos personales (RNF-061).");

        RuleFor(x => x)
            .Custom((x, ctx) =>
            {
                if (!ReglasAgenda.TryResolverInicio(x.Fecha, x.Franja, out _, out var error))
                {
                    ctx.AddFailure(nameof(AgendarVisitaCommand.Franja), error ?? "Fecha u hora inválida.");
                }
            })
            .When(x => x.AceptoTratamientoDatos);
    }
}
