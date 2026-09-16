using Charkhoone.Infrastructure;
using Charkhoone.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

var rabbitMqOptions = RabbitMqWorkerOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(rabbitMqOptions);
builder.Services.AddHostedService<OutboxWorker>();
builder.Services.AddHostedService<CreditApplicationSubmittedConsumer>();

var host = builder.Build();
host.Run();
