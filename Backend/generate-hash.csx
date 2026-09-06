#!/usr/bin/env dotnet-script
#r "nuget: BCrypt.Net-Next, 4.0.3"

using BCrypt.Net;

var password = Args[0];
var hash = BCrypt.HashPassword(password, workFactor: 11);
Console.WriteLine(hash);
