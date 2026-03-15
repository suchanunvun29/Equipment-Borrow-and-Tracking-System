using System.ComponentModel.DataAnnotations;

namespace EquipmentBorrow.API.Models.DTOs.Borrow;

public class RejectBorrowDto
{
    [StringLength(1000, ErrorMessage = "เหตุผลการปฏิเสธยาวเกินกำหนด")]
    public string? Note { get; set; }
}
