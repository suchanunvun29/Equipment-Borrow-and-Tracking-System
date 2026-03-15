using System.Globalization;
using Xunit;

namespace EquipmentBorrow.API.Tests;

public class ThaiDateFormatTests
{
    [Fact]
    public void ThaiBuddhistDateFormat_ShouldUseThaiMonthAndBuddhistYear()
    {
        var dt = new DateTime(2026, 3, 1);
        var culture = new CultureInfo("th-TH");
        var formatted = dt.ToString("d MMMM yyyy", culture);

        Assert.Contains("มีนาคม", formatted);
        Assert.Contains("2569", formatted);
    }
}
