using System.Reflection;
using EquipmentBorrow.API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace EquipmentBorrow.API.Tests;

public class AuthorizationPolicyTests
{
    [Fact]
    public void EquipmentController_Create_Update_Delete_ShouldRequireAdminOnly()
    {
        AssertMethodPolicy(typeof(EquipmentController), "Create", "AdminOnly");
        AssertMethodPolicy(typeof(EquipmentController), "Update", "AdminOnly");
        AssertMethodPolicy(typeof(EquipmentController), "Delete", "AdminOnly");
    }

    [Fact]
    public void BorrowController_Approve_Reject_ShouldRequireAdminOnly()
    {
        AssertMethodPolicy(typeof(BorrowController), "Approve", "AdminOnly");
        AssertMethodPolicy(typeof(BorrowController), "Reject", "AdminOnly");
    }

    [Fact]
    public void ReturnAndReportsController_ShouldRequireAdminOnly()
    {
        AssertClassPolicy(typeof(ReturnController), "AdminOnly");
        AssertClassPolicy(typeof(ReportsController), "AdminOnly");
        AssertClassPolicy(typeof(EmployeeController), "AdminOnly");
    }

    private static void AssertClassPolicy(Type type, string expectedPolicy)
    {
        var attr = type.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(expectedPolicy, attr!.Policy);
    }

    private static void AssertMethodPolicy(Type type, string methodName, string expectedPolicy)
    {
        var method = type.GetMethods().FirstOrDefault(m => m.Name == methodName);
        Assert.NotNull(method);
        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(expectedPolicy, attr!.Policy);
    }
}
