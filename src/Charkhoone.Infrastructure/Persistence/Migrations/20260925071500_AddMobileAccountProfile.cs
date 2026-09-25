using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Charkhoone.Infrastructure.Persistence.Migrations;

[DbContext(typeof(CharkhooneDbContext))]
[Migration("20260925071500_AddMobileAccountProfile")]
public sealed class AddMobileAccountProfile : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "PreferredName", table: "users", type: "character varying(120)", maxLength: 120, nullable: true);
        migrationBuilder.AddColumn<string>(name: "AvatarDataUrl", table: "users", type: "character varying(720000)", maxLength: 720000, nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PreferredName", table: "users");
        migrationBuilder.DropColumn(name: "AvatarDataUrl", table: "users");
    }
}
