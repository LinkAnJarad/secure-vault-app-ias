<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with(['user:id,name,email', 'file:id,original_name'])
            ->orderBy('created_at', 'desc');

        // Filter by action
        if ($request->action) {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->from_date) {
            $query->where('created_at', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->where('created_at', '<=', $request->to_date);
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }
}