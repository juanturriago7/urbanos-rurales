using Portal.Domain.Enums;

namespace Portal.Domain.Entities;

/// <summary>
/// Operación comercial de un inmueble (tabla <c>inmueble_operaciones</c>).
/// Un inmueble puede tener venta y arriendo a la vez, con precios
/// independientes (RF-076); la unicidad (inmueble, tipo) la garantiza la BD.
/// </summary>
public sealed class InmuebleOperacion
{
    public long Id { get; private set; }
    public long InmuebleId { get; private set; }
    public TipoOperacion TipoOperacion { get; private set; }
    public decimal Precio { get; private set; }
    public decimal? CuotaAdministracion { get; private set; }
    public bool AdminIncluida { get; private set; }
    public EstadoOperacion Estado { get; private set; }
    public bool Activo { get; private set; }
    public DateTime CreadoEn { get; private set; }

    // Constructor privado para hidratación desde repositorio (Dapper)
    private InmuebleOperacion() { }

    public static InmuebleOperacion Create(
        long inmuebleId,
        TipoOperacion tipoOperacion,
        decimal precio,
        decimal? cuotaAdministracion = null,
        bool adminIncluida = false)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(inmuebleId, 0);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(precio, 0);

        return new InmuebleOperacion
        {
            InmuebleId = inmuebleId,
            TipoOperacion = tipoOperacion,
            Precio = precio,
            CuotaAdministracion = cuotaAdministracion,
            AdminIncluida = adminIncluida,
            Estado = EstadoOperacion.Disponible,
            Activo = true,
            CreadoEn = DateTime.UtcNow
        };
    }

    public void ActualizarPrecio(decimal precio, decimal? cuotaAdministracion, bool adminIncluida)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(precio, 0);

        Precio = precio;
        CuotaAdministracion = cuotaAdministracion;
        AdminIncluida = adminIncluida;
    }

    public void CambiarEstado(EstadoOperacion estado) => Estado = estado;

    public void Activar() => Activo = true;

    public void Desactivar() => Activo = false;
}
