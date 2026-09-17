using Charkhoone.Infrastructure;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCharkhooneObservability(builder.Configuration, "Charkhoone.Worker");

var rabbitMqOptions = RabbitMqWorkerOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(rabbitMqOptions);
builder.Services.AddHostedService<OutboxWorker>();
builder.Services.AddHostedService<CreditApplicationSubmittedConsumer>();

var host = builder.Build();
host.Run();
